import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const verifyAdminToken = (token?: string) => {
  return token === "Bearer admin-token"
}

const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

// Note: In Next.js 15+, params is a Promise
export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params; // <--- KEY FIX: Await the params

  // Validation Block
  if (!params.id || !isUUID(params.id)) {
    return Response.json({ error: "Invalid ID format" }, { status: 400 })
  }

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

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params; // <--- KEY FIX: Await the params

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