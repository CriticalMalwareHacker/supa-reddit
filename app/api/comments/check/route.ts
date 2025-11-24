import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

// Simple check function - in production, you'd use Reddit's API
async function checkCommentStatus(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { headers: { "User-Agent": "v0-reddit-tracker" } })
    // If we get a 404 or 403, comment is likely removed
    if (response.status === 404 || response.status === 403) {
      return false
    }
    // If we get 200, comment is likely still up
    return response.status === 200
  } catch {
    // If we can't reach it, assume it's down
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { comment_id } = body

    if (!comment_id) {
      return NextResponse.json({ error: "Missing comment_id" }, { status: 400 })
    }

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    })

    // Get comment
    const { data: comment, error: fetchError } = await supabase
      .from("comments")
      .select("*")
      .eq("id", comment_id)
      .single()

    if (fetchError || !comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Check if comment is still live
    const isLive = await checkCommentStatus(comment.reddit_url)
    const newStatus = isLive ? "live" : "removed"

    // Update comment
    const { error: updateError } = await supabase
      .from("comments")
      .update({
        status: newStatus,
        last_checked: new Date().toISOString(),
      })
      .eq("id", comment_id)

    if (updateError) {
      return NextResponse.json({ error: "Failed to update comment" }, { status: 500 })
    }

    // Log check history
    await supabase.from("comment_check_history").insert({
      comment_id,
      status_before: comment.status,
      status_after: newStatus,
      found_live: isLive,
    })

    return NextResponse.json({ success: true, status: newStatus })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
