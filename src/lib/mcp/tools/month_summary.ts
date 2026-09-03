declare const process: { env: Record<string, string | undefined> };
import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sb(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "month_summary",
  title: "Month summary",
  description: "Summarize the signed-in user's profits for a given month (default: current month, Brasília time).",
  inputSchema: {
    year: z.number().int().min(2020).max(2100).optional(),
    month: z.number().int().min(1).max(12).optional().describe("1-12"),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ year, month }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const now = new Date();
    const y = year ?? now.getUTCFullYear();
    const m = month ?? now.getUTCMonth() + 1;
    const start = `${y}-${String(m).padStart(2, "0")}-01T03:00:00Z`;
    const nextY = m === 12 ? y + 1 : y;
    const nextM = m === 12 ? 1 : m + 1;
    const end = `${nextY}-${String(nextM).padStart(2, "0")}-01T03:00:00Z`;
    const { data, error } = await sb(ctx)
      .from("casino_entries")
      .select("amount, account, house, game, type, created_at")
      .gte("created_at", start).lt("created_at", end);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = data ?? [];
    const total = rows.reduce((s, r) => s + Number(r.amount), 0);
    const byAccount: Record<string, number> = {};
    const byHouse: Record<string, number> = {};
    for (const r of rows) {
      byAccount[r.account] = (byAccount[r.account] ?? 0) + Number(r.amount);
      byHouse[r.house] = (byHouse[r.house] ?? 0) + Number(r.amount);
    }
    const summary = { year: y, month: m, total, count: rows.length, byAccount, byHouse };
    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});