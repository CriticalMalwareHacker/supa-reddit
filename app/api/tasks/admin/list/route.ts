import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const verifyAdminToken = (token?: string) => {
  return token === "Bearer admin-token"
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (!verifyAdminToken(authHeader)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: { getAll: () => cookieStore.getAll() },
    })

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("admin_id", "admin")
      .order("created_at", { ascending: false })

    if (error) throw error

    return Response.json({ tasks: data })
  } catch (error: any) {
    console.error("[v0] Error fetching tasks:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
