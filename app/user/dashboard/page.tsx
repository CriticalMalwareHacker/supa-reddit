"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseClient } from "@/lib/supabase-client"
import { SubmitCommentForm } from "@/components/submit-comment-form"
import { UserCommentsList } from "@/components/user-comments-list"

export default function UserDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseClient()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/auth/login")
        return
      }

      setUser(session.user)
      setLoading(false)
    }

    checkAuth()
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">My Comments</h1>
            <p className="text-muted-foreground">Track your Reddit comments and payments</p>
            <p className="text-sm text-muted-foreground mt-2">Email: {user?.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="track" className="mt-8">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="submit">Submit Comment</TabsTrigger>
            <TabsTrigger value="track">My Comments</TabsTrigger>
          </TabsList>

          <TabsContent value="submit" className="mt-6">
            <SubmitCommentForm onCommentSubmitted={() => setRefreshTrigger((prev) => prev + 1)} />
          </TabsContent>

          <TabsContent value="track" className="mt-6">
            <UserCommentsList refreshTrigger={refreshTrigger} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
