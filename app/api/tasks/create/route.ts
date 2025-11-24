import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const verifyAdminToken = (token?: string) => {
  return token === "Bearer admin-token"
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (!verifyAdminToken(authHeader)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { title, description, subreddit, payment_amount, deadline } = await request.json()

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: { getAll: () => cookieStore.getAll() },
    })

    const { data, error } = await supabase.from("tasks").insert({
      admin_id: "admin",
      title,
      description,
      subreddit,
      payment_amount,
      deadline,
      status: "active",
    })

    if (error) throw error

    return Response.json({ task: data })
  } catch (error: any) {
    console.error("[v0] Task creation error:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
