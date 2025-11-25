"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2 } from "lucide-react"

interface SubmitForTaskFormProps {
  taskId: string
  paymentAmount: number
}

export function SubmitForTaskForm({ taskId, paymentAmount }: SubmitForTaskFormProps) {
  const [loading, setLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("binance")
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    
    // CHANGE: Get discord_username instead of email
    const discord_username = formData.get("discord_username") as string
    const reddit_comment_url = formData.get("reddit_comment_url") as string
    const payment_id = formData.get("payment_id") as string

    try {
      const res = await fetch("/api/submissions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          discord_username, // Send discord username
          reddit_comment_url,
          [paymentMethod === "binance" ? "binance_id" : "upi_id"]: payment_id,
        }),
      })

      if (res.ok) {
        setIsSubmitted(true)
        toast({ description: "Submission created successfully! Admin will review it." })
        form.reset()
        
        setTimeout(() => {
          router.push("/")
        }, 2000)
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

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in duration-500">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
        <h3 className="text-2xl font-bold text-foreground">Submission Received!</h3>
        <p className="text-muted-foreground mt-2">
          Thank you for your submission. Redirecting you back to tasks...
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        {/* CHANGE: Label and Input for Discord Username */}
        <Label htmlFor="discord_username">Discord Username</Label>
        <Input id="discord_username" name="discord_username" placeholder="username#1234" required />
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