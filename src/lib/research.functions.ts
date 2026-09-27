import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Comparable } from "./research/types";

interface ResearchPayload {
  query: string;
  brand?: string | null;
  category?: string | null;
}

/**
 * Prijedlozi usporedivih oglasa. MVP koristi mock provider; sučelje je
 * pripremljeno za kasniju integraciju stvarne web-pretrage.
 */
export const suggestComparables = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ResearchPayload) => {
    const query = (input?.query ?? "").trim();
    if (query.length < 2) throw new Error("Unesite pojam za pretragu.");
    return { query: query.slice(0, 120), brand: input.brand ?? null, category: input.category ?? null };
  })
  .handler(async ({ data }): Promise<Comparable[]> => {
    const { mockResearchProvider } = await import("./research/mock-provider.server");
    return mockResearchProvider.findComparables(data);
  });
