"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase-client"

export function SubmitCommentForm({ onCommentSubmitted }: { onCommentSubmitted: () => void }) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = getSupabaseClient()
  const [paymentMethod, setPaymentMethod] = useState<"binance" | "upi">("binance")
  const [formData, setFormData] = useState({
    reddit_url: "",
    reddit_comment_id: "",
    subreddit: "",
    payment_deadline: "",
    payment_id: "",
    notes: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "Error",
          description: "Not authenticated",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/comments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          user_id_auth: user.id,
          email: user.email,
          payment_method: paymentMethod,
          price: 0.15,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Comment submitted and monitoring started!",
        })
        setFormData({
          reddit_url: "",
          reddit_comment_id: "",
          subreddit: "",
          payment_deadline: "",
          payment_id: "",
          notes: "",
        })
        setPaymentMethod("binance")
        onCommentSubmitted()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to submit comment",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit comment",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Reddit Comment</CardTitle>
        <CardDescription>
          Add a Reddit comment to track. You'll be paid $0.15 if it stays live until your deadline.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reddit_url">Reddit Comment URL *</Label>
              <Input
                id="reddit_url"
                name="reddit_url"
                placeholder="https://reddit.com/r/example/comments/..."
                value={formData.reddit_url}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reddit_comment_id">Comment ID *</Label>
              <Input
                id="reddit_comment_id"
                name="reddit_comment_id"
                placeholder="e.g., abc123xyz"
                value={formData.reddit_comment_id}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subreddit">Subreddit *</Label>
              <Input
                id="subreddit"
                name="subreddit"
                placeholder="e.g., programming"
                value={formData.subreddit}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_deadline">Payment Deadline *</Label>
              <Input
                id="payment_deadline"
                name="payment_deadline"
                type="datetime-local"
                value={formData.payment_deadline}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                <SelectTrigger id="payment_method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="binance">Binance</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_id">Payment ID ({paymentMethod.toUpperCase()}) *</Label>
              <Input
                id="payment_id"
                name="payment_id"
                placeholder={paymentMethod === "binance" ? "Your Binance ID" : "Your UPI ID"}
                value={formData.payment_id}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any additional notes or context..."
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>Payment:</strong> $0.15 if your comment stays live until the deadline.
            </p>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Comment"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
