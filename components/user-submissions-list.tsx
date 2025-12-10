"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Clock, CheckCircle2, XCircle } from "lucide-react"

interface Submission {
  id: string
  reddit_comment_url: string
  submission_status: string
  created_at: string
  tasks: {
    title: string
    payment_amount: number
  }
}

export function UserSubmissionsList({ refreshTrigger }: { refreshTrigger: number }) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await fetch("/api/submissions/user/list")
        if (res.ok) {
          const data = await res.json()
          setSubmissions(data.submissions || [])
        }
      } catch (error) {
        console.error("Error fetching submissions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissions()
  }, [refreshTrigger])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1"><CheckCircle2 className="w-3 h-3"/> Approved</Badge>
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3"/> Rejected</Badge>
      default:
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3"/> Pending</Badge>
    }
  }

  if (loading) return <div>Loading...</div>

  if (submissions.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        You haven't submitted any tasks yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {submissions.map((sub) => (
        <Card key={sub.id}>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="space-y-1">
                <h4 className="font-semibold">{sub.tasks?.title || "Unknown Task"}</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Earn: ${sub.tasks?.payment_amount}</span>
                  <span>•</span>
                  <span>{new Date(sub.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                {getStatusBadge(sub.submission_status)}
                
                <a href={sub.reddit_comment_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="h-8">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Comment
                  </Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}