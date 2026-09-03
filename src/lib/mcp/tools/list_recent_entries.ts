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
  name: "list_recent_entries",
  title: "List recent casino entries",
  description: "List the signed-in user's most recent casino profit entries (dashboard history).",
  inputSchema: {
    limit: z.number().int().min(1).max(100).default(20).describe("How many entries to return."),
    account: z.enum(["Ruan", "Rita"]).optional().describe("Filter by account (Ruan or Rita)."),
    house: z.string().optional().describe("Filter by casino/house name."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ limit, account, house }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = sb(ctx).from("casino_entries").select("*").order("created_at", { ascending: false }).limit(limit);
    if (account) q = q.eq("account", account);
    if (house) q = q.ilike("house", house);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { entries: data ?? [] },
    };
  },
});