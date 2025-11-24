"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { ExternalLink, RefreshCw, Trash2 } from "lucide-react"

interface Comment {
  id: string
  reddit_url: string
  subreddit: string
  status: "pending" | "live" | "removed" | "paid" | "failed"
  payment_deadline: string
  payment_amount: number
  last_checked: string
  created_at: string
}

export function CommentsList({ refreshTrigger }: { refreshTrigger: number }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchComments()
  }, [refreshTrigger])

  const fetchComments = async () => {
    try {
      const response = await fetch("/api/comments/list")
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async (commentId: string) => {
    try {
      const response = await fetch("/api/comments/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_id: commentId }),
      })

      if (response.ok) {
        toast({
          title: "Refreshed",
          description: "Comment status updated",
        })
        fetchComments()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh comment status",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (commentId: string) => {
    try {
      const response = await fetch("/api/comments/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_id: commentId }),
      })

      if (response.ok) {
        toast({
          title: "Deleted",
          description: "Comment removed from tracking",
        })
        fetchComments()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "bg-green-500/10 text-green-700 hover:bg-green-500/20"
      case "removed":
        return "bg-red-500/10 text-red-700 hover:bg-red-500/20"
      case "paid":
        return "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20"
      default:
        return "bg-gray-500/10 text-gray-700 hover:bg-gray-500/20"
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">Loading...</CardContent>
      </Card>
    )
  }

  if (comments.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          No comments submitted yet. Start by submitting your first comment!
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <Card key={comment.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-semibold">r/{comment.subreddit}</p>
                  <Badge className={getStatusColor(comment.status)}>
                    {comment.status.charAt(0).toUpperCase() + comment.status.slice(1)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{comment.reddit_url}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <div>
                <p className="text-muted-foreground">Payment Amount</p>
                <p className="font-semibold text-lg">${comment.payment_amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Deadline</p>
                <p className="font-semibold">{formatDate(comment.payment_deadline)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Checked</p>
                <p className="font-semibold text-sm">
                  {comment.last_checked ? formatDate(comment.last_checked) : "Not checked"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Submitted</p>
                <p className="font-semibold text-sm">{formatDate(comment.created_at)}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(comment.reddit_url, "_blank")}
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Reddit
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleRefresh(comment.id)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(comment.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
