import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const verifyAdminToken = (token?: string) => {
  return token === "Bearer admin-token" // Make sure your frontend sends this exact token!
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const authHeader = request.headers.get("authorization")

  if (!verifyAdminToken(authHeader ?? undefined)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: { getAll: () => cookieStore.getAll() },
      }
    )

    // 1. Update status and fetch necessary data
    const { data: submission, error: updateError } = await supabase
      .from("task_submissions")
      .update({ submission_status: "approved" })
      .eq("id", params.id)
      .select(`
        id, 
        user_id, 
        tasks ( title )
      `)
      .single()

    if (updateError) throw updateError
    if (!submission) throw new Error("Submission not found")

    // --- DEBUGGING LOGS ---
    console.log("Processing Submission:", submission.id);
    console.log("User ID to DM:", submission.user_id); // CHECK IF THIS SAYS NULL
    // ---------------------

    // 2. Send DM (Only if we have a user to send to)
    if (submission.user_id) {
        
        // FIX: Handle 'tasks' being an array or object safely
        const taskData = submission.tasks as any;
        const taskTitle = Array.isArray(taskData) ? taskData[0]?.title : taskData?.title;

        const { error: msgError } = await supabase
        .from('messages')
        .insert({
            recipient_id: submission.user_id,
            content: `✅ Your submission for "${taskTitle || 'Task'}" has been APPROVED!`,
            related_submission_id: submission.id,
            is_read: false
        })
        
        if (msgError) {
            console.error("Failed to insert DM:", msgError)
        } else {
            console.log("✅ DM sent successfully")
        }
    } else {
        console.warn("⚠️ Skipping DM: No user_id found on submission.")
    }

    return Response.json({ success: true })

  } catch (error: any) {
    console.error("Error approving submission:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}