import type { AnalyzeInput, ListingAiProvider, ListingDraft } from "./types";

/**
 * Mock provider: deterministički generira uvjerljiv nacrt oglasa iz ponuđenih
 * naznaka. Zamjenjuje se stvarnim vision modelom kroz isto sučelje.
 */

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick<T>(list: readonly T[], seed: number, offset = 0): T {
  return list[(seed + offset) % list.length] as T;
}

const BRANDS = ["Zara", "Mango", "COS", "Levi's", "H&M", "Massimo Dutti", "Nike"];
const TYPES = ["oversized košulja", "midi haljina", "traper jakna", "pleteni pulover", "trench kaput", "tenisice"];
const CATEGORIES = ["Žene", "Muškarci", "Obuća", "Torbe i dodaci"];
const SUBCATEGORIES = ["Košulje i bluze", "Haljine", "Jakne i kaputi", "Puloveri", "Tenisice"];
const COLORS = ["bež", "crna", "maslinasto zelena", "krem", "tamnoplava", "bordo"];
const MATERIALS = ["100% pamuk", "vuna i viskoza", "traper", "posteljno platno", "eko koža"];
const SIZES = ["XS", "S", "M", "L", "XL", "38", "40", "42"];
const CONDITIONS = ["Odlično", "Vrlo dobro", "Novo bez etikete", "Dobro"];
const FLAWS = [
  "Bez vidljivih oštećenja.",
  "Blagi tragovi nošenja na rubovima rukava.",
  "Sitna mrljica na unutarnjoj strani, nevidljiva pri nošenju.",
  "Jedan rezervni gumb nedostaje.",
];

const BRAND_TIER: Record<string, number> = {
  cos: 1.35,
  "massimo dutti": 1.3,
  nike: 1.25,
  "levi's": 1.2,
  zara: 1,
  mango: 0.95,
  "h&m": 0.8,
};

export const mockListingProvider: ListingAiProvider = {
  name: "mock-v1",
  async analyze(input: AnalyzeInput): Promise<ListingDraft> {
    const seed = hash(input.seed);
    const h = input.hints;

    const brand = h.brand?.trim() || pick(BRANDS, seed, 1);
    const model = pick(TYPES, seed, 2);
    const category = h.category?.trim() || pick(CATEGORIES, seed, 3);
    const subcategory = pick(SUBCATEGORIES, seed, 4);
    const color = pick(COLORS, seed, 5);
    const material = pick(MATERIALS, seed, 6);
    const size = h.size?.trim() || pick(SIZES, seed, 7);
    const condition = h.condition?.trim() || pick(CONDITIONS, seed, 8);
    const flaws = pick(FLAWS, seed, 9);

    // Više fotografija => veća sigurnost prepoznavanja.
    const photoBoost = Math.min(input.imageCount, 6) * 0.03;
    const conf = (base: number, given: boolean) =>
      Math.min(0.97, Number(((given ? 0.95 : base) + photoBoost).toFixed(2)));

    const tier = BRAND_TIER[brand.toLowerCase()] ?? 1;
    const conditionFactor = condition.startsWith("Novo") ? 1.25 : condition === "Odlično" ? 1.1 : 0.95;
    const base = 14 * tier * conditionFactor + (seed % 7);
    const cost = h.cost ?? null;
    const floor = cost ? Math.max(cost * 1.3, 4) : 4;

    const recommended = Math.max(Math.round(base), Math.round(floor));
    const quick = Math.max(Math.round(recommended * 0.82), Math.round(floor));
    const min = Math.max(Math.round(recommended * 0.68), Math.round(floor));

    const title = `${brand} ${model} ${color} vel. ${size}`
      .replace(/\s+/g, " ")
      .slice(0, 70);

    const keywords = [
      brand.toLowerCase(),
      model.split(" ")[0] ?? "",
      color,
      size,
      category.toLowerCase(),
      "second hand",
      "vintage stil",
    ].filter(Boolean);

    const tone = h.tone ?? "profesionalan";
    const opening =
      tone === "topao"
        ? `Predivan komad iz moje garderobe — ${brand} ${model}.`
        : tone === "sazet"
          ? `${brand} ${model}, veličina ${size}.`
          : tone === "prodajni"
            ? `Odličan ulov: ${brand} ${model} u boji ${color}.`
            : `${brand} ${model} u boji ${color}, veličina ${size}.`;

    const description = [
      opening,
      "",
      `• Brand: ${brand}`,
      `• Vrsta: ${model}`,
      `• Veličina: ${size}`,
      `• Boja: ${color}`,
      `• Materijal: ${material}`,
      `• Stanje: ${condition}`,
      `• Napomena: ${flaws}`,
      "",
      "Šaljem brzo i pažljivo zapakirano. Slobodno pitajte za dodatne fotografije ili mjere.",
    ].join("\n");

    const rationale = [
      `Preporučena cijena temelji se na razini branda (${brand}), stanju artikla (${condition}) i tipičnom rasponu za kategoriju ${category}.`,
      cost ? `Nabavna cijena ${cost} € pokrivena je marginom od najmanje 30%.` : "Nabavna cijena nije unesena, pa je minimalna cijena postavljena na sigurnu donju granicu.",
      "Cijena za brzu prodaju je približno 18% niža i služi za brži obrtaj, dok je minimalna cijena donja granica za pregovor.",
      "Ovo je tržišna orijentacija, a ne jamstvo prodajne cijene.",
    ].join(" ");

    return {
      fields: { brand, model, category, subcategory, color, material, size, condition, flaws },
      confidence: {
        brand: conf(0.72, Boolean(h.brand)),
        model: conf(0.64, false),
        category: conf(0.78, Boolean(h.category)),
        subcategory: conf(0.6, false),
        color: conf(0.85, false),
        material: conf(0.52, false),
        size: conf(0.58, Boolean(h.size)),
        condition: conf(0.66, Boolean(h.condition)),
        flaws: conf(0.49, false),
      },
      title,
      description,
      keywords,
      pricing: {
        recommendedPrice: recommended,
        quickSalePrice: quick,
        minPrice: min,
        rationale,
      },
      provider: "mock-v1",
    };
  },
};
