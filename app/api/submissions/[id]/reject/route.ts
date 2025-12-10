import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const verifyAdminToken = (token?: string) => {
  return token === "Bearer admin-token"
}

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  const authHeader = request.headers.get("authorization")
  if (!verifyAdminToken(authHeader ?? undefined)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: { getAll: () => cookieStore.getAll() },
    })

    // STEP 1: Fetch the submission simply (No complex joins that might crash)
    const { data: submission, error: fetchError } = await supabase
      .from("task_submissions")
      .select("id, user_id, discord_username")
      .eq("id", params.id)
      .single()

    if (fetchError || !submission) {
      console.error("Submission fetch error:", fetchError)
      throw new Error("Submission not found")
    }

    // STEP 2: Try to find the user's Discord ID for notification
    // We do this in a try/catch block so notification failure doesn't stop the rejection
    try {
      if (submission.user_id && DISCORD_BOT_TOKEN && DISCORD_GUILD_ID) {
        
        // Fetch the provider_id from your public users table
        const { data: userData } = await supabase
          .from("users")
          .select("provider_id")
          .eq("auth_id", submission.user_id)
          .single()

        const targetUserId = userData?.provider_id;

        if (targetUserId) {
            // Fetch channels
            const channelsResponse = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/channels`, {
              headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
            })
            
            if (channelsResponse.ok) {
                const channels = await channelsResponse.json()

                // Find the ticket channel
                const ticketChannel = channels.find((ch: any) => {
                    if (ch.type !== 0) return false; 
                    if (!ch.name.startsWith('ticket-')) return false; 

                    // Check permissions for this user
                    const userOverwrite = ch.permission_overwrites?.find((perm: any) => 
                        perm.id === targetUserId && 
                        perm.type === 1 
                    );
                    return !!userOverwrite;
                })

                if (ticketChannel) {
                  // Send Message
                  await fetch(`https://discord.com/api/v10/channels/${ticketChannel.id}/messages`, {
                    method: 'POST',
                    headers: { 
                      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
                      "Content-Type": "application/json" 
                    },
                    body: JSON.stringify({
                      content: `❌ **Task Rejected**\nHello <@${targetUserId}>, your task submission has been rejected.\n\n**Reason:** Requirements not met or link invalid.\nPlease check the dashboard.`
                    })
                  })
                }
            }
        }
      }
    } catch (notifyError) {
      // Just log notification errors, don't stop the rejection!
      console.warn("Failed to send Discord notification:", notifyError)
    }

    // STEP 3: Always update the status, even if notification failed
    const { error: updateError } = await supabase
      .from("task_submissions")
      .update({ submission_status: "rejected" })
      .eq("id", params.id)

    if (updateError) throw updateError

    return Response.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error rejecting submission:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}