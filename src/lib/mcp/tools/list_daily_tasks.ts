declare const process: { env: Record<string, string | undefined> };
import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function sb(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function todayBrasilia(): string {
  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return brt.toISOString().slice(0, 10);
}

export default defineTool({
  name: "list_daily_tasks",
  title: "List daily tasks",
  description: "List today's daily tasks for the signed-in user with completion status per account (Brasília timezone).",
  inputSchema: {},
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const client = sb(ctx);
    const today = todayBrasilia();
    const [tasks, done] = await Promise.all([
      client.from("daily_tasks").select("*").order("created_at"),
      client.from("daily_task_completions").select("*").eq("completion_date", today),
    ]);
    if (tasks.error) return { content: [{ type: "text", text: tasks.error.message }], isError: true };
    if (done.error) return { content: [{ type: "text", text: done.error.message }], isError: true };
    const completions = done.data ?? [];
    const result = (tasks.data ?? []).map((t: any) => ({
      id: t.id,
      title: t.title,
      house: t.house,
      description: t.description,
      accounts: t.accounts,
      completedBy: completions.filter((c: any) => c.task_id === t.id).map((c: any) => c.account),
    }));
    return {
      content: [{ type: "text", text: JSON.stringify({ date: today, tasks: result }, null, 2) }],
      structuredContent: { date: today, tasks: result },
    };
  },
});