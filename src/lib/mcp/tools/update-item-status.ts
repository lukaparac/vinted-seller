import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_item_status",
  title: "Update item status",
  description: "Change an item's status in the seller's inventory (e.g. mark as sold). Does not touch Vinted.",
  inputSchema: {
    id: z.string().uuid().describe("Item id."),
    status: z.enum(["draft", "ready", "listed", "reserved", "sold", "shipped"]),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, status }, ctx) => {
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb.from("items").update({ status }).eq("id", id).select("id, sku, status").maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError("Item not found.");
    await sb.from("activity_log").insert({ user_id: ctx.getUserId()!, item_id: id, action: `Status: ${status} (MCP)` });
    const item = { id: data.id, sku: data.sku, status: data.status };
    return { content: [{ type: "text", text: JSON.stringify(item) }], structuredContent: { item } };
  },
});
