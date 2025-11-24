"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Task {
  id: string
  title: string
  subreddit: string
  payment_amount: number
  deadline: string
  status: string
}

interface AdminTasksListProps {
  refreshTrigger: number
}

export function AdminTasksList({ refreshTrigger }: AdminTasksListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem("adminToken")
        const res = await fetch("/api/tasks/admin/list", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setTasks(data.tasks || [])
        }
      } catch (error) {
        console.error("[v0] Error fetching tasks:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [refreshTrigger])

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure?")) return

    try {
      const token = localStorage.getItem("adminToken")
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        setTasks(tasks.filter((t) => t.id !== taskId))
        toast({ description: "Task deleted" })
      } else {
        toast({ description: "Failed to delete task", variant: "destructive" })
      }
    } catch (error) {
      console.error("[v0] Error deleting task:", error)
      toast({ description: "An error occurred", variant: "destructive" })
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Subreddit</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                No tasks created yet
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>r/{task.subreddit}</TableCell>
                <TableCell>${task.payment_amount}</TableCell>
                <TableCell>{new Date(task.deadline).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge>{task.status}</Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(task.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
