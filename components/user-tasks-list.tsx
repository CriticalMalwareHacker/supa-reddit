"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, DollarSign } from "lucide-react"

interface Task {
  id: string
  title: string
  description: string
  subreddit: string
  payment_amount: number
  deadline: string
  status: string
}

export function UserTasksList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch("/api/tasks")
        const data = await res.json()
        setTasks(data.tasks || [])
      } catch (error) {
        console.error("Error fetching tasks:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [])

  if (loading) return <div className="text-center py-10">Loading tasks...</div>

  if (tasks.length === 0) {
    return (
      <div className="text-center py-10 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">No tasks available right now. Check back later!</p>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {tasks.map((task) => (
        <Card key={task.id} className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start gap-2">
              <CardTitle className="text-lg">{task.title}</CardTitle>
              <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                ${task.payment_amount}
              </Badge>
            </div>
            <CardDescription>r/{task.subreddit}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
              {task.description}
            </p>
            <Link href={`/task/${task.id}`} className="w-full">
              <Button className="w-full group">
                Claim Task
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}