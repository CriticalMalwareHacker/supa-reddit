"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseClient } from "@/lib/supabase-client"

interface Comment {
  id: string
  reddit_url: string
  subreddit: string
  email: string
  status: string
  payment_deadline: string
  price: number
  payment_method: string
  payment_id: string
  last_checked: string
  created_at: string
}

export function AdminCommentsList({ refreshTrigger }: { refreshTrigger: number }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = getSupabaseClient()

  const fetchComments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("comments").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch comments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [refreshTrigger])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return

    setDeleting(id)
    try {
      const { error } = await supabase.from("comments").delete().eq("id", id)
      if (error) throw error

      setComments((prev) => prev.filter((c) => c.id !== id))
      toast({
        title: "Success",
        description: "Comment deleted",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      })
    } finally {
      setDeleting(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      case "removed":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      case "paid":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
      case "failed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (comments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No comments yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-semibold">User Email</th>
              <th className="text-left py-3 px-4 font-semibold">Subreddit</th>
              <th className="text-left py-3 px-4 font-semibold">Status</th>
              <th className="text-left py-3 px-4 font-semibold">Payment Method</th>
              <th className="text-left py-3 px-4 font-semibold">Amount</th>
              <th className="text-left py-3 px-4 font-semibold">Deadline</th>
              <th className="text-left py-3 px-4 font-semibold">Last Checked</th>
              <th className="text-left py-3 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {comments.map((comment) => (
              <tr key={comment.id} className="border-b hover:bg-muted/50">
                <td className="py-3 px-4">{comment.email}</td>
                <td className="py-3 px-4">r/{comment.subreddit}</td>
                <td className="py-3 px-4">
                  <Badge className={getStatusColor(comment.status)}>{comment.status}</Badge>
                </td>
                <td className="py-3 px-4">{comment.payment_method.toUpperCase()}</td>
                <td className="py-3 px-4">${comment.price}</td>
                <td className="py-3 px-4 text-sm">{new Date(comment.payment_deadline).toLocaleString()}</td>
                <td className="py-3 px-4 text-sm">
                  {comment.last_checked ? new Date(comment.last_checked).toLocaleString() : "Not checked"}
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.open(comment.reddit_url, "_blank")}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(comment.id)}
                      disabled={deleting === comment.id}
                    >
                      {deleting === comment.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
