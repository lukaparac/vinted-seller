import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_listing",
  title: "Get item listing",
  description: "Get one item with its prepared listing (title, Croatian description, keywords, prices) by item id or SKU.",
  inputSchema: {
    id: z.string().uuid().optional().describe("Item id."),
    sku: z.string().trim().optional().describe("Item SKU, e.g. LP-VNT-0001."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, sku }, ctx) => {
    if (!id && !sku) throw new ToolError("Provide id or sku.");
    const sb = supabaseForUser(ctx);
    let q = sb.from("items").select("*");
    q = id ? q.eq("id", id) : q.eq("sku", sku!);
    const { data: item, error } = await q.maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!item) throw new ToolError("Item not found.");
    const { data: l } = await sb.from("listings").select("*").eq("item_id", item.id).maybeSingle();
    const result = {
      item: {
        id: item.id,
        sku: item.sku,
        title: item.title,
        brand: item.brand,
        model: item.model,
        category: item.category,
        subcategory: item.subcategory,
        color: item.color,
        material: item.material,
        size: item.size,
        condition: item.condition,
        flaws: item.flaws,
        cost: item.cost,
        status: item.status,
      },
      listing: l
        ? {
            title: l.title,
            description: l.description,
            keywords: l.keywords ?? [],
            recommended_price: l.recommended_price,
            quick_sale_price: l.quick_sale_price,
            min_price: l.min_price,
            pricing_rationale: l.pricing_rationale,
            approved_at: l.approved_at,
          }
        : null,
    };
    return { content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: result };
  },
});
