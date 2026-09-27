import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Item = Tables<"items">;
export type ItemImage = Tables<"item_images">;
export type Listing = Tables<"listings">;
export type ResearchRow = Tables<"pricing_research">;
export type ListingVersion = Tables<"listing_versions">;

export async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Niste prijavljeni.");
  return data.user.id;
}

export async function fetchItems(): Promise<Item[]> {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchItem(id: string) {
  const [item, images, listing] = await Promise.all([
    supabase.from("items").select("*").eq("id", id).maybeSingle(),
    supabase.from("item_images").select("*").eq("item_id", id).order("position"),
    supabase.from("listings").select("*").eq("item_id", id).maybeSingle(),
  ]);
  if (item.error) throw item.error;
  if (images.error) throw images.error;
  if (listing.error) throw listing.error;
  if (!item.data) throw new Error("Artikl nije pronađen.");
  return {
    item: item.data as Item,
    images: (images.data ?? []) as ItemImage[],
    listing: (listing.data ?? null) as Listing | null,
  };
}

export async function logActivity(itemId: string | null, action: string, detail?: string) {
  const userId = await requireUserId();
  await supabase.from("activity_log").insert({
    user_id: userId,
    item_id: itemId,
    action,
    detail: detail ?? null,
  });
}
