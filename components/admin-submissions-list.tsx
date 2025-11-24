"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Submission {
  id: string
  task_id: string
  user_email: string
  reddit_comment_url: string
  submission_status: string
  payment_status: string
  binance_id?: string
  upi_id?: string
}

interface AdminSubmissionsListProps {
  refreshTrigger: number
}

export function AdminSubmissionsList({ refreshTrigger }: AdminSubmissionsListProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const token = localStorage.getItem("adminToken")
        const res = await fetch("/api/submissions/admin/list", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setSubmissions(data.submissions || [])
        }
      } catch (error) {
        console.error("[v0] Error fetching submissions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissions()
  }, [refreshTrigger])

  const handleApprove = async (submissionId: string) => {
    try {
      const token = localStorage.getItem("adminToken")
      const res = await fetch(`/api/submissions/${submissionId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        setSubmissions(submissions.map((s) => (s.id === submissionId ? { ...s, submission_status: "approved" } : s)))
        toast({ description: "Submission approved" })
      }
    } catch (error) {
      console.error("[v0] Error approving:", error)
      toast({ description: "An error occurred", variant: "destructive" })
    }
  }

  const handleReject = async (submissionId: string) => {
    try {
      const token = localStorage.getItem("adminToken")
      const res = await fetch(`/api/submissions/${submissionId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        setSubmissions(submissions.map((s) => (s.id === submissionId ? { ...s, submission_status: "rejected" } : s)))
        toast({ description: "Submission rejected" })
      }
    } catch (error) {
      console.error("[v0] Error rejecting:", error)
      toast({ description: "An error occurred", variant: "destructive" })
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="rounded-lg border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Comment URL</TableHead>
            <TableHead>Payment ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                No submissions yet
              </TableCell>
            </TableRow>
          ) : (
            submissions.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell className="text-sm">{sub.user_email}</TableCell>
                <TableCell>
                  <a href={sub.reddit_comment_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                </TableCell>
                <TableCell className="text-sm">{sub.binance_id || sub.upi_id}</TableCell>
                <TableCell>
                  <Badge variant={sub.submission_status === "approved" ? "default" : "secondary"}>
                    {sub.submission_status}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  {sub.submission_status === "pending" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApprove(sub.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReject(sub.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
