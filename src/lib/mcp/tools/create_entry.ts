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
  name: "create_entry",
  title: "Create casino entry",
  description: "Create a new profit/loss entry in the signed-in user's dashboard.",
  inputSchema: {
    amount: z.number().describe("Profit (positive) or loss (negative) amount."),
    type: z.string().describe("Entry type (e.g. bonus, giros, apostas, missao, aposte_ganhe)."),
    house: z.string().min(1).describe("Casino/house name."),
    game: z.string().min(1).describe("Game name."),
    account: z.enum(["Ruan", "Rita"]).default("Ruan"),
    notes: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  handler: async ({ amount, type, house, game, account, notes }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await sb(ctx)
      .from("casino_entries")
      .insert({ amount, type, house, game, account, notes: notes ?? null, user_id: ctx.getUserId() })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Created entry ${data.id}` }],
      structuredContent: { entry: data },
    };
  },
});