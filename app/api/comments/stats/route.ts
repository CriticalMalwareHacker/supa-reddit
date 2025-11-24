import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    })

    const { data, error } = await supabase.from("comments").select("status, payment_amount")

    if (error) {
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
    }

    const stats = {
      total_comments: data.length,
      live_comments: data.filter((c: any) => c.status === "live").length,
      removed_comments: data.filter((c: any) => c.status === "removed").length,
      pending_comments: data.filter((c: any) => c.status === "pending").length,
      total_potential_payout: data.reduce((sum: number, c: any) => sum + c.payment_amount, 0),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
