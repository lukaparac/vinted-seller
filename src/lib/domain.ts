export type ItemStatus = "draft" | "ready" | "listed" | "reserved" | "sold" | "shipped";

export const STATUS_ORDER: ItemStatus[] = [
  "draft",
  "ready",
  "listed",
  "reserved",
  "sold",
  "shipped",
];

export const STATUS_LABEL: Record<ItemStatus, string> = {
  draft: "Skica",
  ready: "Spremno",
  listed: "Objavljeno",
  reserved: "Rezervirano",
  sold: "Prodano",
  shipped: "Poslano",
};

export const CONDITIONS = [
  "Novo s etiketom",
  "Novo bez etikete",
  "Odlično",
  "Vrlo dobro",
  "Dobro",
  "Zadovoljavajuće",
] as const;

export const CATEGORIES = [
  "Žene",
  "Muškarci",
  "Djeca",
  "Obuća",
  "Torbe i dodaci",
  "Dom",
] as const;

export const TONES = [
  { value: "profesionalan", label: "Profesionalan" },
  { value: "topao", label: "Topao i osobni" },
  { value: "sazet", label: "Sažet i činjeničan" },
  { value: "prodajni", label: "Prodajno uvjerljiv" },
] as const;

export function formatEur(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("hr-HR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("hr-HR", { dateStyle: "medium" }).format(new Date(value));
}

export function confidenceLabel(score: number): string {
  if (score >= 0.8) return "Visoka";
  if (score >= 0.55) return "Srednja";
  return "Niska";
}
