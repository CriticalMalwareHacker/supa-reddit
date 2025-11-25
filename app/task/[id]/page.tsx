"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ExternalLink } from "lucide-react" // CHANGE: Import ExternalLink
import { SubmitForTaskForm } from "@/components/submit-for-task-form"
import { Spinner } from "@/components/ui/spinner"

interface Task {
  id: string
  title: string
  description: string
  subreddit: string
  post_link?: string // CHANGE: Add post_link to interface
  payment_amount: number
  deadline: string
  status: string
}

export default function TaskDetailPage() {
  const params = useParams()
  const taskId = params.id as string
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await fetch(`/api/tasks/${taskId}`)
        if (res.ok) {
          const data = await res.json()
          setTask(data.task)
        }
      } catch (error) {
        console.error("[v0] Error fetching task:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTask()
  }, [taskId])

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Spinner />
      </main>
    )
  }

  if (!task) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-muted-foreground">Task not found</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tasks
          </Button>
        </Link>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Task Details */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>{task.title}</CardTitle>
                <CardDescription>r/{task.subreddit}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge>{task.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment per comment</p>
                  <p className="text-3xl font-bold">${task.payment_amount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Deadline</p>
                  <p className="font-medium">{new Date(task.deadline).toLocaleDateString()}</p>
                </div>
                
                {/* CHANGE: Display clickable post link */}
                {task.post_link && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Target Post</p>
                    <a href={task.post_link} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="w-full">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open on Reddit
                      </Button>
                    </a>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm mt-2">{task.description}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submission Form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Submit Your Comment</CardTitle>
                <CardDescription>Post a comment in r/{task.subreddit} and share the link below</CardDescription>
              </CardHeader>
              <CardContent>
                <SubmitForTaskForm taskId={task.id} paymentAmount={task.payment_amount} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}