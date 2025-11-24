import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  const { task_id, user_email, reddit_comment_url, binance_id, upi_id } = await request.json()

  if (!task_id || !user_email || !reddit_comment_url) {
    return Response.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } },
    )

    const { data, error } = await supabase.from("task_submissions").insert({
      task_id,
      user_email,
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
