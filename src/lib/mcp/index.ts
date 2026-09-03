import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listRecentEntries from "./tools/list_recent_entries";
import createEntry from "./tools/create_entry";
import monthSummary from "./tools/month_summary";
import listDailyTasks from "./tools/list_daily_tasks";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "casino-tracker-mcp",
  title: "Casino Tracker MCP",
  version: "0.1.0",
  instructions:
    "Tools for the signed-in user's Casino Tracker data: list recent profit entries, create new entries, summarize the month, and inspect daily tasks. All tools act as the authenticated user via RLS.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listRecentEntries, createEntry, monthSummary, listDailyTasks],
});