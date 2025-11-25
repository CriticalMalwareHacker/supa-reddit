import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  // CHANGE: Removed user_email, added discord_username
  const { task_id, discord_username, reddit_comment_url, binance_id, upi_id } = await request.json()

  if (!task_id || !discord_username || !reddit_comment_url) {
    return Response.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } },
    )

    // CHANGE: Insert discord_username instead of user_email
    const { data, error } = await supabase.from("task_submissions").insert({
      task_id,
      discord_username, 
      user_email: "", // or null if you updated the schema
      reddit_comment_url,
      binance_id,
      upi_id,
      submission_status: "pending",
    })

    if (error) throw error

    return Response.json({ submission: data })
  } catch (error: any) {
    console.error("[v0] Error creating submission:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}