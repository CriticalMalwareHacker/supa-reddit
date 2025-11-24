"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"

interface Task {
  id: string
  title: string
  description: string
  subreddit: string
  payment_amount: number
  deadline: string
  status: string
  created_at: string
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch("/api/tasks")
        const data = await res.json()
        setTasks(data.tasks || [])
      } catch (error) {
        console.error("[v0] Error fetching tasks:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Available Tasks</h1>
            <p className="text-muted-foreground">Complete Reddit tasks and earn money</p>
          </div>
          <Link href="/admin/login">
            <Button variant="outline">Admin Login</Button>
          </Link>
        </div>

        {/* Tasks Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No tasks available at the moment</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <Link key={task.id} href={`/task/${task.id}`}>
                <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                  <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{task.title}</CardTitle>
                        <CardDescription className="mt-1">r/{task.subreddit}</CardDescription>
                      </div>
                      <Badge variant="secondary">{task.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-foreground">{task.description}</p>
                    <div className="flex justify-between items-center pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">Payment</p>
                        <p className="text-2xl font-bold text-foreground">${task.payment_amount}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Deadline</p>
                        <p className="text-sm font-medium">{new Date(task.deadline).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
