import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Helper for admin token verification (moved from create/route.ts)
const verifyAdminToken = (token?: string) => {
  return token === "Bearer admin-token"
}

// GET Handler (Replaces api/tasks/list)
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } },
    )

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (error) throw error

    return Response.json({ tasks: data })
  } catch (error: any) {
    console.error("[v0] Error fetching tasks:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// POST Handler (Replaces api/tasks/create)
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