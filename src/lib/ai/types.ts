/**
 * Ugovor AI sloja. UI ovisi isključivo o ovim tipovima, pa se mock provider
 * kasnije može zamijeniti stvarnim vision modelom bez promjena u sučelju.
 */

export type FieldConfidence = Record<string, number>;

export interface ListingHints {
  brand?: string | null;
  category?: string | null;
  size?: string | null;
  condition?: string | null;
  cost?: number | null;
  tone?: string | null;
  notes?: string | null;
}

export interface AnalyzedFields {
  brand: string;
  model: string;
  category: string;
  subcategory: string;
  color: string;
  material: string;
  size: string;
  condition: string;
  flaws: string;
}

export interface PricingGuidance {
  recommendedPrice: number;
  quickSalePrice: number;
  minPrice: number;
  rationale: string;
}

export interface ListingDraft {
  fields: AnalyzedFields;
  confidence: FieldConfidence;
  title: string;
  description: string;
  keywords: string[];
  pricing: PricingGuidance;
  provider: string;
}

export interface AnalyzeInput {
  seed: string;
  imageCount: number;
  hints: ListingHints;
}

export interface ListingAiProvider {
  name: string;
  analyze(input: AnalyzeInput): Promise<ListingDraft>;
}
