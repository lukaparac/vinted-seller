import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listItems from "./tools/list-items";
import getListing from "./tools/get-listing";
import updateItemStatus from "./tools/update-item-status";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "vinted-seller-app",
  title: "Vinted Seller APP",
  version: "0.1.0",
  instructions:
    "Access the signed-in seller's resale inventory and prepared Vinted listings. Use `list_items` to browse, `get_listing` for full listing text and prices, `update_item_status` to change status. The app never publishes to Vinted.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listItems, getListing, updateItemStatus],
});
