"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase-client"

export function AdminStats({ refreshTrigger }: { refreshTrigger: number }) {
  const [stats, setStats] = useState({
    total: 0,
    live: 0,
    removed: 0,
    paid: 0,
    totalAmount: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase.from("comments").select("*")

        if (error) throw error

        const comments = data || []
        const liveCount = comments.filter((c) => c.status === "live").length
        const removedCount = comments.filter((c) => c.status === "removed").length
        const paidCount = comments.filter((c) => c.status === "paid").length
        const totalAmount = comments.reduce((sum, c) => sum + (c.price || 0), 0)

        setStats({
          total: comments.length,
          live: liveCount,
          removed: removedCount,
          paid: paidCount,
          totalAmount,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [refreshTrigger])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.total}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Live</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-600">{stats.live}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Removed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-red-600">{stats.removed}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Paid</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-blue-600">{stats.paid}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Payout</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">${stats.totalAmount.toFixed(2)}</p>
        </CardContent>
      </Card>
    </div>
  )
}
