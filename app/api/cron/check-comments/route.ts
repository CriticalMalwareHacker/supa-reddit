import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

// This route is meant to be called by Vercel Cron
// Configure in vercel.json to run every 5 minutes
export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    })

    // Get all pending and live comments that haven't been checked recently
    const { data: comments, error: fetchError } = await supabase
      .from("comments")
      .select("*")
      .in("status", ["pending", "live"])
      .or(`last_checked.is.null,last_checked.lt.${new Date(Date.now() - 5 * 60000).toISOString()}`)

    if (fetchError) {
      console.error("Error fetching comments:", fetchError)
      return NextResponse.json({ error: "Failed to fetch comments", details: fetchError }, { status: 500 })
    }

    if (!comments || comments.length === 0) {
      return NextResponse.json({
        success: true,
        checked: 0,
        message: "No comments to check",
      })
    }

    let checked = 0
    let updated = 0

    // Check each comment
    for (const comment of comments) {
      try {
        const isLive = await checkCommentStatus(comment.reddit_url)
        const newStatus = isLive ? "live" : "removed"
        const statusChanged = newStatus !== comment.status

        // Update comment status
        const { error: updateError } = await supabase
          .from("comments")
          .update({
            status: newStatus,
            last_checked: new Date().toISOString(),
          })
          .eq("id", comment.id)

        if (!updateError) {
          checked++

          // Log history
          if (statusChanged) {
            await supabase.from("comment_check_history").insert({
              comment_id: comment.id,
              status_before: comment.status,
              status_after: newStatus,
              found_live: isLive,
            })
            updated++
          }
        }
      } catch (error) {
        console.error(`Error checking comment ${comment.id}:`, error)

        // Log error in history
        await supabase.from("comment_check_history").insert({
          comment_id: comment.id,
          status_before: comment.status,
          status_after: comment.status,
          found_live: false,
          error_message: String(error),
        })
      }
    }

    return NextResponse.json({
      success: true,
      checked,
      updated,
      message: `Checked ${checked} comments, ${updated} status changes detected`,
    })
  } catch (error) {
    console.error("Cron job error:", error)
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 })
  }
}

// Helper function to check if comment is still live
async function checkCommentStatus(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; v0-reddit-tracker/1.0)",
      },
      timeout: 5000,
    })

    // Reddit returns 404 or 403 for removed/deleted comments
    if (response.status === 404 || response.status === 403) {
      return false
    }

    // Check if we got a redirect to r/removed or similar
    if (response.redirected) {
      const finalUrl = response.url.toLowerCase()
      if (finalUrl.includes("/removed") || finalUrl.includes("/delete")) {
        return false
      }
    }

    // If we got 200, assume it's live
    return response.status === 200
  } catch (error) {
    console.error(`Error checking ${url}:`, error)
    // If we can't reach it, assume it's down
    return false
  }
}
