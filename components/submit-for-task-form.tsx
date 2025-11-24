"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"

interface SubmitForTaskFormProps {
  taskId: string
  paymentAmount: number
}

export function SubmitForTaskForm({ taskId, paymentAmount }: SubmitForTaskFormProps) {
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("binance")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const user_email = formData.get("user_email") as string
    const reddit_comment_url = formData.get("reddit_comment_url") as string
    const payment_id = formData.get("payment_id") as string

    try {
      const res = await fetch("/api/submissions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          user_email,
          reddit_comment_url,
          [paymentMethod === "binance" ? "binance_id" : "upi_id"]: payment_id,
        }),
      })

      if (res.ok) {
        toast({ description: "Submission created successfully! Admin will review it." })
        e.currentTarget.reset()
      } else {
        const data = await res.json()
        toast({ description: data.error || "Failed to submit", variant: "destructive" })
      }
    } catch (error) {
      console.error("[v0] Error submitting:", error)
      toast({ description: "An error occurred", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="user_email">Your Email</Label>
        <Input id="user_email" name="user_email" type="email" placeholder="your@email.com" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reddit_comment_url">Reddit Comment URL</Label>
        <Input
          id="reddit_comment_url"
          name="reddit_comment_url"
          placeholder="https://reddit.com/r/subreddit/comments/..."
          required
        />
      </div>

      <div className="space-y-3">
        <Label>Payment Method</Label>
        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="binance" id="binance" />
            <Label htmlFor="binance" className="font-normal cursor-pointer">
              Binance
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="upi" id="upi" />
            <Label htmlFor="upi" className="font-normal cursor-pointer">
              UPI
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment_id">{paymentMethod === "binance" ? "Binance Pay ID" : "UPI ID"}</Label>
        <Input
          id="payment_id"
          name="payment_id"
          placeholder={paymentMethod === "binance" ? "your@binance.com" : "yourname@upi"}
          required
        />
      </div>

      <div className="bg-muted p-3 rounded-lg">
        <p className="text-sm">
          <span className="font-semibold">Earning: ${paymentAmount}</span> if your comment stays live until the deadline
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Submitting..." : "Submit Comment"}
      </Button>
    </form>
  )
}
