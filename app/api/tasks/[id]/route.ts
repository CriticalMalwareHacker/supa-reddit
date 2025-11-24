import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const verifyAdminToken = (token?: string) => {
  return token === "Bearer admin-token"
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } },
    )

    const { data, error } = await supabase.from("tasks").select("*").eq("id", params.id).single()

    if (error) throw error

    return Response.json({ task: data })
  } catch (error: any) {
    console.error("[v0] Error fetching task:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const authHeader = request.headers.get("authorization")
  if (!verifyAdminToken(authHeader)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: { getAll: () => cookieStore.getAll() },
    })

    const { error } = await supabase.from("tasks").delete().eq("id", params.id)

    if (error) throw error

    return Response.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting task:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
