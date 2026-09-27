import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ListingDraft, ListingHints } from "./ai/types";

interface AnalyzePayload {
  itemId: string;
  imageCount: number;
  hints: ListingHints;
}

/**
 * Priprema nacrt oglasa. Radi isključivo s podacima koje je korisnik unio i
 * fotografijama koje je sam učitao — nema dohvaćanja s Vinteda ni objave.
 */
export const analyzeListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: AnalyzePayload) => {
    if (!input || typeof input.itemId !== "string" || input.itemId.length < 10) {
      throw new Error("Nedostaje ispravan artikl.");
    }
    return {
      itemId: input.itemId,
      imageCount: Math.max(0, Math.min(20, Number(input.imageCount) || 0)),
      hints: input.hints ?? {},
    };
  })
  .handler(async ({ data }): Promise<ListingDraft> => {
    const { mockListingProvider } = await import("./ai/mock-provider.server");
    return mockListingProvider.analyze({
      seed: data.itemId,
      imageCount: data.imageCount,
      hints: data.hints,
    });
  });
