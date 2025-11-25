import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const verifyAdminToken = (token?: string) => {
  return token === "Bearer admin-token"
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  const authHeader = request.headers.get("authorization")
  // FIX: Add '?? undefined' to handle null
  if (!verifyAdminToken(authHeader ?? undefined)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: { getAll: () => cookieStore.getAll() },
    })

    const { error } = await supabase
      .from("task_submissions")
      .update({ submission_status: "rejected" })
      .eq("id", params.id)

    if (error) throw error

    return Response.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error rejecting submission:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}