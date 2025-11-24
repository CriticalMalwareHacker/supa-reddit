"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface CreateTaskFormProps {
  onTaskCreated: () => void
}

export function CreateTaskForm({ onTaskCreated }: CreateTaskFormProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const subreddit = formData.get("subreddit") as string
    const payment_amount = Number.parseFloat(formData.get("payment_amount") as string)
    const deadline = formData.get("deadline") as string

    try {
      const res = await fetch("/api/tasks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          subreddit,
          payment_amount,
          deadline,
        }),
      })

      if (res.ok) {
        toast({ description: "Task created successfully" })
        e.currentTarget.reset()
        onTaskCreated()
      } else {
        toast({ description: "Failed to create task", variant: "destructive" })
      }
    } catch (error) {
      console.error("[v0] Error creating task:", error)
      toast({ description: "An error occurred", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Task Title</Label>
        <Input id="title" name="title" placeholder="e.g., Comment on AMA Thread" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" placeholder="What should users comment about?" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subreddit">Subreddit (without r/)</Label>
          <Input id="subreddit" name="subreddit" placeholder="e.g., AskReddit" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_amount">Payment per comment ($)</Label>
          <Input
            id="payment_amount"
            name="payment_amount"
            type="number"
            step="0.01"
            placeholder="0.15"
            defaultValue="0.15"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="deadline">Deadline</Label>
        <Input id="deadline" name="deadline" type="datetime-local" required />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating..." : "Create Task"}
      </Button>
    </form>
  )
}
