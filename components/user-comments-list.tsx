"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseClient } from "@/lib/supabase-client"

interface Comment {
  id: string
  reddit_url: string
  subreddit: string
  status: string
  payment_deadline: string
  price: number
  payment_method: string
  payment_id: string
  last_checked: string
  created_at: string
}

export function UserCommentsList({ refreshTrigger }: { refreshTrigger: number }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = getSupabaseClient()

  const fetchComments = async () => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("user_id_auth", user.id)
        .order("created_at", { ascending: false })

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
          <p className="text-muted-foreground mb-4">No comments submitted yet</p>
          <p className="text-sm text-muted-foreground">Submit your first comment to start earning!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <Card key={comment.id}>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Subreddit</p>
                <p className="font-medium">r/{comment.subreddit}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={getStatusColor(comment.status)}>{comment.status}</Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-medium">{comment.payment_method.toUpperCase()}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Payment Amount</p>
                <p className="font-medium">${comment.price}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Deadline</p>
                <p className="font-medium">{new Date(comment.payment_deadline).toLocaleString()}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Last Checked</p>
                <p className="font-medium">
                  {comment.last_checked ? new Date(comment.last_checked).toLocaleString() : "Not checked yet"}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.open(comment.reddit_url, "_blank")}>
                <ExternalLink className="w-4 h-4 mr-2" />
                View Comment
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
