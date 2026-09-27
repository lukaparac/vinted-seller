import type { Comparable, ResearchProvider, ResearchQuery } from "./types";

/**
 * Mock provider za istraživanje tržišta. Kasnije se zamjenjuje stvarnom
 * web-pretragom kroz isto sučelje; podaci su uvijek samo orijentacija.
 */
export const mockResearchProvider: ResearchProvider = {
  name: "mock-research-v1",
  async findComparables(input: ResearchQuery): Promise<Comparable[]> {
    const label = [input.brand, input.query].filter(Boolean).join(" ").trim() || "sličan artikl";
    const today = new Date().toISOString().slice(0, 10);
    const bases = [12, 16, 19, 24];

    return bases.map((price, i) => ({
      title: `${label} — usporedivi oglas ${i + 1}`,
      sourceUrl: null,
      observedPrice: price,
      currency: "EUR",
      checkedAt: today,
      notes:
        i === 0
          ? "Primjer podatka iz demo izvora. Zamijenite stvarnim opažanjem s tržišta."
          : "Demo podatak za prikaz raspona cijena.",
    }));
  },
};
