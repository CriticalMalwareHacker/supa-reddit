import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      reddit_url,
      reddit_comment_id,
      subreddit,
      payment_deadline,
      user_id_auth,
      email,
      payment_method,
      payment_id,
      price,
      notes,
    } = body

    if (
      !reddit_url ||
      !reddit_comment_id ||
      !subreddit ||
      !payment_deadline ||
      !user_id_auth ||
      !email ||
      !payment_method ||
      !payment_id
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    })

    const { data, error } = await supabase
      .from("comments")
      .insert({
        reddit_url,
        reddit_comment_id,
        subreddit,
        user_id_auth,
        email,
        payment_method,
        payment_id,
        price: price || 0.15,
        notes,
        status: "pending",
      })
      .select()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to submit comment" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
