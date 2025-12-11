// app/api/submissions/[id]/route.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const submissionId = params.id;

  try {
    // 1. Initialize Supabase (Fixes 'Module not found')
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: { getAll: () => cookieStore.getAll() },
      }
    );

    // 2. Fetch Submission + Task Owner
    // We use a join to get the task details
    const { data: submission, error: fetchError } = await supabase
      .from("task_submissions")
      .select(`
        id,
        user_id,
        tasks (
          title,
          user_id
        )
      `)
      .eq("id", submissionId)
      .single();

    if (fetchError || !submission) {
      console.error("Submission lookup failed:", fetchError);
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // 3. Handle the Array Issue (Fixes 'Property does not exist')
    // Supabase sometimes returns 'tasks' as an array or an object depending on the query
    const taskData = submission.tasks as any;
    const taskOwnerId = Array.isArray(taskData) ? taskData[0]?.user_id : taskData?.user_id;
    const taskTitle = Array.isArray(taskData) ? taskData[0]?.title : taskData?.title;

    // 4. Send the DM
    if (taskOwnerId) {
      const { error: msgError } = await supabase.from("messages").insert({
        recipient_id: taskOwnerId, // Notification goes to Task Owner
        content: `📬 New submission received for: "${taskTitle || "Unknown Task"}"`,
        related_submission_id: submission.id,
        is_read: false,
      });

      if (msgError) console.error("DB Error saving Message:", msgError);
      else console.log("✅ Notification sent to Task Owner");
    } else {
      console.warn("⚠️ No Task Owner found. Skipping notification.");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}