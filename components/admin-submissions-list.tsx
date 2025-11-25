"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { CheckCircle2, XCircle, ExternalLink, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Submission {
  id: string
  task_id: string
  discord_username: string 
  reddit_comment_url: string
  submission_status: string
  payment_status: string
  binance_id?: string
  upi_id?: string
  tasks?: { title: string }
  created_at: string
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

  const sendDiscordNotification = async (username: string, status: 'approved' | 'rejected') => {
      const message = status === 'approved' 
        ? `Sent approval message to ${username}: "Your comment has been approved!"`
        : `Sent rejection message to ${username}: "Comment removed."`
      
      toast({ 
          title: "Discord Notification", 
          description: message 
      })
  }

  const handleApprove = async (submission: Submission) => {
    try {
      const token = localStorage.getItem("adminToken")
      const res = await fetch(`/api/submissions/${submission.id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        setSubmissions(prev => prev.map((s) => (s.id === submission.id ? { ...s, submission_status: "approved" } : s)))
        toast({ description: "Submission approved" })
        await sendDiscordNotification(submission.discord_username, 'approved')
      } else {
         const errorData = await res.json()
         toast({ description: errorData.error || "Failed to approve", variant: "destructive" })
      }
    } catch (error) {
      console.error("[v0] Error approving:", error)
      toast({ description: "An error occurred", variant: "destructive" })
    }
  }

  const handleReject = async (submission: Submission) => {
    try {
      const token = localStorage.getItem("adminToken")
      const res = await fetch(`/api/submissions/${submission.id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        setSubmissions(prev => prev.map((s) => (s.id === submission.id ? { ...s, submission_status: "rejected" } : s)))
        toast({ description: "Submission rejected" })
        await sendDiscordNotification(submission.discord_username, 'rejected')
      } else {
         const errorData = await res.json()
         toast({ description: errorData.error || "Failed to reject", variant: "destructive" })
      }
    } catch (error) {
      console.error("[v0] Error rejecting:", error)
      toast({ description: "An error occurred", variant: "destructive" })
    }
  }

  const handleExportCSV = () => {
    if (submissions.length === 0) {
      toast({ description: "No data to export", variant: "destructive" })
      return
    }

    const headers = ["ID", "Task", "Discord User", "Comment URL", "Status", "Payment Method", "Payment ID", "Created At"]
    
    const csvRows = [headers.join(",")]

    submissions.forEach(sub => {
      // Helper to escape fields that might contain commas (like task titles)
      const safeField = (field: string | undefined) => `"${(field || '').replace(/"/g, '""')}"`

      const row = [
        sub.id,
        safeField(sub.tasks?.title || 'Unknown Task'),
        safeField(sub.discord_username),
        safeField(sub.reddit_comment_url),
        sub.submission_status,
        sub.binance_id ? "Binance" : "UPI",
        safeField(sub.binance_id || sub.upi_id || "N/A"),
        new Date(sub.created_at).toLocaleDateString()
      ]
      csvRows.push(row.join(","))
    })

    const csvContent = csvRows.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `submissions_export_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Group submissions by Task Title
  const groupedSubmissions = submissions.reduce((acc, submission) => {
    const taskTitle = submission.tasks?.title || "Unknown Task";
    if (!acc[taskTitle]) {
      acc[taskTitle] = [];
    }
    acc[taskTitle].push(submission);
    return acc;
  }, {} as Record<string, Submission[]>);

  if (loading) return <div>Loading...</div>

  if (submissions.length === 0) {
     return (
       <div className="text-center py-6 text-muted-foreground border rounded-lg">
         No submissions yet
       </div>
     )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleExportCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export to CSV
        </Button>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedSubmissions).map(([taskTitle, taskSubmissions]) => (
          <Card key={taskTitle}>
            <CardHeader className="bg-muted/50 py-4">
               <CardTitle className="text-lg">{taskTitle}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Discord User</TableHead>
                    <TableHead>Comment URL</TableHead>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taskSubmissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="text-sm font-medium">{sub.discord_username}</TableCell>
                      <TableCell>
                        <a href={sub.reddit_comment_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </a>
                      </TableCell>
                      <TableCell className="text-sm">{sub.binance_id || sub.upi_id}</TableCell>
                      <TableCell>
                        <Badge variant={sub.submission_status === "approved" ? "default" : (sub.submission_status === "rejected" ? "destructive" : "secondary")}>
                          {sub.submission_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-2">
                        {sub.submission_status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(sub)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-100"
                              title="Approve & Notify"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReject(sub)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-100"
                              title="Reject & Notify"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}