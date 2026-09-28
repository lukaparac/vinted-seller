import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const STATUSES = ["draft", "ready", "listed", "reserved", "sold", "shipped"] as const;

export default defineTool({
  name: "list_items",
  title: "List inventory items",
  description: "List the signed-in seller's inventory items, optionally filtered by status or search text.",
  inputSchema: {
    status: z.enum(STATUSES).optional().describe("Filter by item status."),
    search: z.string().trim().optional().describe("Match SKU, title or brand."),
    limit: z.number().int().min(1).max(100).optional().describe("Max rows (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, search, limit }, ctx) => {
    const sb = supabaseForUser(ctx);
    let q = sb
      .from("items")
      .select("id, sku, title, brand, category, size, condition, cost, price, status, created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);
    if (status) q = q.eq("status", status);
    if (search) {
      const s = search.replace(/[,%()]/g, " ");
      q = q.or(`sku.ilike.%${s}%,title.ilike.%${s}%,brand.ilike.%${s}%`);
    }
    const { data, error } = await q;
    if (error) throw new ToolError(error.message);
    const items = (data ?? []).map((r) => ({
      id: r.id,
      sku: r.sku,
      title: r.title,
      brand: r.brand,
      category: r.category,
      size: r.size,
      condition: r.condition,
      cost: r.cost,
      price: r.price,
      status: r.status,
      created_at: r.created_at,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(items) }],
      structuredContent: { items },
    };
  },
});
