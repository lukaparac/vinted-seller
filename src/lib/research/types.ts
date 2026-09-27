export interface Comparable {
  title: string;
  sourceUrl: string | null;
  observedPrice: number;
  currency: string;
  checkedAt: string;
  notes: string | null;
}

export interface ResearchQuery {
  query: string;
  brand?: string | null;
  category?: string | null;
}

export interface ResearchProvider {
  name: string;
  findComparables(input: ResearchQuery): Promise<Comparable[]>;
}
