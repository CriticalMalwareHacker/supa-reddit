import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } },
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch submissions for this specific user, including task details
    const { data, error } = await supabase
      .from("task_submissions")
      .select("*, tasks(title, payment_amount)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return Response.json({ submissions: data })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}