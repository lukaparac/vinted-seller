import { supabase } from "@/integrations/supabase/client";
import { requireUserId } from "./items";

const DEMO = [
  {
    title: "COS oversized košulja bež vel. M",
    brand: "COS",
    model: "oversized košulja",
    category: "Žene",
    subcategory: "Košulje i bluze",
    color: "bež",
    material: "100% pamuk",
    size: "M",
    condition: "Odlično",
    flaws: "Bez vidljivih oštećenja.",
    cost: 6,
    price: 24,
    quick_sale_price: 20,
    min_price: 16,
    status: "ready",
    description:
      "COS oversized košulja u boji bež, veličina M.\n\n• Brand: COS\n• Materijal: 100% pamuk\n• Stanje: Odlično\n\nŠaljem brzo i pažljivo zapakirano.",
    keywords: ["cos", "košulja", "bež", "m", "second hand"],
  },
  {
    title: "Levi's 501 traper jakna plava vel. L",
    brand: "Levi's",
    model: "traper jakna",
    category: "Muškarci",
    subcategory: "Jakne i kaputi",
    color: "tamnoplava",
    material: "traper",
    size: "L",
    condition: "Vrlo dobro",
    flaws: "Blagi tragovi nošenja na rubovima rukava.",
    cost: 12,
    price: 39,
    quick_sale_price: 32,
    min_price: 27,
    status: "listed",
    description:
      "Levi's traper jakna, veličina L.\n\n• Brand: Levi's\n• Materijal: traper\n• Stanje: Vrlo dobro\n\nPitajte slobodno za mjere.",
    keywords: ["levis", "traper", "jakna", "l"],
  },
  {
    title: "Zara pleteni pulover krem vel. S",
    brand: "Zara",
    model: "pleteni pulover",
    category: "Žene",
    subcategory: "Puloveri",
    color: "krem",
    material: "vuna i viskoza",
    size: "S",
    condition: "Dobro",
    flaws: "Sitna mrljica na unutarnjoj strani, nevidljiva pri nošenju.",
    cost: 4,
    price: 14,
    quick_sale_price: 11,
    min_price: 9,
    status: "sold",
    description:
      "Zara pleteni pulover u krem boji, veličina S.\n\n• Stanje: Dobro\n• Materijal: vuna i viskoza",
    keywords: ["zara", "pulover", "krem", "s"],
  },
];

/** Ubacuje nekoliko demo artikala kako bi sučelje odmah bilo razumljivo. */
export async function seedDemoData() {
  const userId = await requireUserId();

  for (const demo of DEMO) {
    const { data: item, error } = await supabase
      .from("items")
      .insert({
        user_id: userId,
        title: demo.title,
        brand: demo.brand,
        model: demo.model,
        category: demo.category,
        subcategory: demo.subcategory,
        color: demo.color,
        material: demo.material,
        size: demo.size,
        condition: demo.condition,
        flaws: demo.flaws,
        cost: demo.cost,
        price: demo.price,
        quick_sale_price: demo.quick_sale_price,
        min_price: demo.min_price,
        status: demo.status,
        analyzed_at: new Date().toISOString(),
        ai_confidence: {
          brand: 0.92,
          model: 0.74,
          category: 0.88,
          subcategory: 0.66,
          color: 0.9,
          material: 0.58,
          size: 0.8,
          condition: 0.71,
          flaws: 0.54,
        },
      })
      .select("id")
      .single();
    if (error) throw error;

    const { error: listingError } = await supabase.from("listings").insert({
      item_id: item.id,
      user_id: userId,
      title: demo.title,
      description: demo.description,
      keywords: demo.keywords,
      recommended_price: demo.price,
      quick_sale_price: demo.quick_sale_price,
      min_price: demo.min_price,
      pricing_rationale:
        "Demo podatak: cijena je procijenjena na temelju branda, stanja i kategorije. Tržišna orijentacija, ne jamstvo prodajne cijene.",
      approved_at: demo.status === "draft" ? null : new Date().toISOString(),
    });
    if (listingError) throw listingError;

    await supabase.from("pricing_research").insert({
      user_id: userId,
      item_id: item.id,
      comparable_title: `${demo.brand} ${demo.model} — usporedivi oglas`,
      observed_price: Math.max(3, Math.round(demo.price * 0.9)),
      notes: "Demo zapis istraživanja tržišta.",
    });

    await supabase.from("activity_log").insert({
      user_id: userId,
      item_id: item.id,
      action: "Demo artikl kreiran",
      detail: demo.title,
    });
  }
}
