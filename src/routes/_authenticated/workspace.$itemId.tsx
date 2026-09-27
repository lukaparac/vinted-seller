import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, Loader2, RefreshCw, Save } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ConfidenceMeter } from "@/components/confidence-meter";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionUser } from "@/hooks/use-profile";
import { useSignedImages } from "@/hooks/use-signed-images";
import { supabase } from "@/integrations/supabase/client";
import { analyzeListing } from "@/lib/ai.functions";
import { fetchItem, type Item } from "@/lib/items";
import { formatEur } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/workspace/$itemId")({
  head: () => ({
    meta: [
      { title: "AI radni prostor — Vinted Seller OS" },
      { name: "description", content: "Pregledajte i uredite AI prijedlog oglasa prije objave." },
      { property: "og:title", content: "AI radni prostor — Vinted Seller OS" },
      {
        property: "og:description",
        content: "Pregledajte i uredite AI prijedlog oglasa prije objave.",
      },
    ],
  }),
  component: Workspace,
});

const FIELDS = [
  ["brand", "Brand"],
  ["model", "Model / tip"],
  ["category", "Kategorija"],
  ["subcategory", "Potkategorija"],
  ["color", "Boja"],
  ["material", "Materijal"],
  ["size", "Veličina"],
  ["condition", "Stanje"],
] as const;

type FormState = {
  brand: string;
  model: string;
  category: string;
  subcategory: string;
  color: string;
  material: string;
  size: string;
  condition: string;
  flaws: string;
  title: string;
  description: string;
  keywords: string;
  price: string;
  quick: string;
  min: string;
  rationale: string;
};

const EMPTY: FormState = {
  brand: "",
  model: "",
  category: "",
  subcategory: "",
  color: "",
  material: "",
  size: "",
  condition: "",
  flaws: "",
  title: "",
  description: "",
  keywords: "",
  price: "",
  quick: "",
  min: "",
  rationale: "",
};

function Workspace() {
  const { itemId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: user } = useSessionUser();
  const analyze = useServerFn(analyzeListing);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["item", itemId],
    queryFn: () => fetchItem(itemId),
  });

  const [form, setForm] = useState<FormState>(EMPTY);
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [provider, setProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const paths = (data?.images ?? []).map((img) => img.storage_path);
  const signed = useSignedImages(paths).data ?? {};

  useEffect(() => {
    if (!data) return;
    const { item, listing } = data;
    setForm({
      brand: item.brand ?? "",
      model: item.model ?? "",
      category: item.category ?? "",
      subcategory: item.subcategory ?? "",
      color: item.color ?? "",
      material: item.material ?? "",
      size: item.size ?? "",
      condition: item.condition ?? "",
      flaws: item.flaws ?? "",
      title: listing?.title ?? item.title ?? "",
      description: listing?.description ?? "",
      keywords: (listing?.keywords ?? []).join(", "),
      price: listing?.recommended_price != null ? String(listing.recommended_price) : "",
      quick: listing?.quick_sale_price != null ? String(listing.quick_sale_price) : "",
      min: listing?.min_price != null ? String(listing.min_price) : "",
      rationale: listing?.pricing_rationale ?? "",
    });
    setConfidence((item.ai_confidence as Record<string, number> | null) ?? {});
  }, [data]);

  const runAnalysis = useMutation({
    mutationFn: async () => {
      const item = data!.item as Item;
      return analyze({
        data: {
          itemId: item.id,
          imageCount: data!.images.length,
          hints: {
            brand: form.brand || item.brand,
            category: form.category || item.category,
            size: form.size || item.size,
            condition: form.condition || item.condition,
            cost: item.cost != null ? Number(item.cost) : null,
            notes: item.notes,
          },
        },
      });
    },
    onSuccess: (draft) => {
      setForm((prev) => ({
        ...prev,
        ...draft.fields,
        title: draft.title,
        description: draft.description,
        keywords: draft.keywords.join(", "),
        price: String(draft.pricing.recommendedPrice),
        quick: String(draft.pricing.quickSalePrice),
        min: String(draft.pricing.minPrice),
        rationale: draft.pricing.rationale,
      }));
      setConfidence(draft.confidence);
      setProvider(draft.provider);
      setError(null);
      toast.success("Prijedlog oglasa je spreman za pregled.");
    },
    onError: () => setError("Analiza nije uspjela. Pokušajte ponovno."),
  });

  const persist = useMutation({
    mutationFn: async (approve: boolean) => {
      if (!user || !data) throw new Error("Niste prijavljeni.");
      if (form.title.trim().length < 5) throw new Error("Naslov mora imati barem 5 znakova.");
      if (approve && form.description.trim().length < 20)
        throw new Error("Opis mora imati barem 20 znakova prije odobrenja.");

      const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));
      const price = num(form.price);
      const quick = num(form.quick);
      const min = num(form.min);
      for (const [label, v] of [
        ["Preporučena cijena", price],
        ["Cijena za brzu prodaju", quick],
        ["Najniža cijena", min],
      ] as const) {
        if (v !== null && (Number.isNaN(v) || v < 0)) throw new Error(`${label} nije ispravna.`);
      }

      const keywords = form.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      const { error: itemError } = await supabase
        .from("items")
        .update({
          title: form.title.trim(),
          brand: form.brand || null,
          model: form.model || null,
          category: form.category || null,
          subcategory: form.subcategory || null,
          color: form.color || null,
          material: form.material || null,
          size: form.size || null,
          condition: form.condition || null,
          flaws: form.flaws || null,
          price,
          quick_sale_price: quick,
          min_price: min,
          ai_confidence: confidence,
          analyzed_at: new Date().toISOString(),
          status: approve ? "ready" : data.item.status,
        })
        .eq("id", itemId);
      if (itemError) throw itemError;

      const payload = {
        item_id: itemId,
        user_id: user.id,
        title: form.title.trim(),
        description: form.description,
        keywords,
        recommended_price: price,
        quick_sale_price: quick,
        min_price: min,
        pricing_rationale: form.rationale || null,
        approved_at: approve ? new Date().toISOString() : (data.listing?.approved_at ?? null),
      };
      const { data: listing, error: listingError } = await supabase
        .from("listings")
        .upsert(payload, { onConflict: "item_id" })
        .select("id")
        .single();
      if (listingError) throw listingError;

      const { count } = await supabase
        .from("listing_versions")
        .select("id", { count: "exact", head: true })
        .eq("listing_id", listing.id);

      await supabase.from("listing_versions").insert({
        listing_id: listing.id,
        user_id: user.id,
        version: (count ?? 0) + 1,
        snapshot: payload,
        change_note: approve ? "Oglas odobren" : "Skica spremljena",
      });

      await supabase.from("activity_log").insert({
        user_id: user.id,
        item_id: itemId,
        action: approve ? "Oglas odobren" : "Skica spremljena",
      });

      return approve;
    },
    onSuccess: (approved) => {
      setError(null);
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["item", itemId] });
      toast.success(approved ? "Oglas je odobren i spreman za objavu." : "Skica je spremljena.");
      if (approved) navigate({ to: "/listing/$itemId", params: { itemId } });
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Spremanje nije uspjelo."),
  });

  if (isLoading) {
    return (
      <AppShell title="AI radni prostor" email={user?.email}>
        <Skeleton className="h-96 rounded-lg" />
      </AppShell>
    );
  }

  if (isError || !data) {
    return (
      <AppShell title="AI radni prostor" email={user?.email}>
        <div className="panel p-6">
          <p className="text-sm text-destructive">Artikl nije pronađen.</p>
        </div>
      </AppShell>
    );
  }

  const set = (key: keyof FormState) => (value: string) => setForm((p) => ({ ...p, [key]: value }));

  return (
    <AppShell
      title={data.item.sku ?? "AI radni prostor"}
      description="AI priprema prijedlog — vi ga pregledavate, uređujete i odobravate."
      email={user?.email}
      actions={<StatusBadge status={data.item.status} />}
    >
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <div className="panel p-4">
            <h2 className="text-overline">Fotografije</h2>
            {data.images.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nema učitanih fotografija.</p>
            ) : (
              <ul className="mt-3 grid grid-cols-2 gap-2">
                {data.images.map((img, i) => (
                  <li key={img.id} className="overflow-hidden rounded-md border border-border">
                    {signed[img.storage_path] ? (
                      <img
                        src={signed[img.storage_path]}
                        alt={`Fotografija ${i + 1}`}
                        className="aspect-square w-full object-cover"
                      />
                    ) : (
                      <Skeleton className="aspect-square w-full" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel p-4">
            <Button
              className="w-full"
              onClick={() => runAnalysis.mutate()}
              disabled={runAnalysis.isPending}
            >
              {runAnalysis.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              {data.item.analyzed_at || provider ? "Generiraj ponovno" : "Analiziraj s AI"}
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              Motor: {provider ?? "mock-v1"}. Ništa se ne objavljuje automatski.
            </p>
          </div>
        </aside>

        <div className="space-y-6">
          <section className="panel p-6">
            <h2 className="text-xl">Prepoznata svojstva</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {FIELDS.map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor={key}>{label}</Label>
                    <ConfidenceMeter score={confidence[key]} />
                  </div>
                  <Input id={key} value={form[key]} onChange={(e) => set(key)(e.target.value)} />
                </div>
              ))}
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="flaws">Vidljivi nedostaci</Label>
                  <ConfidenceMeter score={confidence["flaws"]} />
                </div>
                <Textarea
                  id="flaws"
                  rows={2}
                  value={form.flaws}
                  onChange={(e) => set("flaws")(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="panel p-6">
            <h2 className="text-xl">Oglas</h2>
            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Naslov</Label>
                <Input id="title" value={form.title} onChange={(e) => set("title")(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Opis (hrvatski)</Label>
                <Textarea
                  id="description"
                  rows={10}
                  value={form.description}
                  onChange={(e) => set("description")(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keywords">Ključne riječi (odvojene zarezom)</Label>
                <Input
                  id="keywords"
                  value={form.keywords}
                  onChange={(e) => set("keywords")(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="panel p-6">
            <h2 className="text-xl">Preporuka cijene</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tržišna orijentacija, ne jamstvo prodajne cijene.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="price">Preporučena (€)</Label>
                <Input id="price" inputMode="decimal" value={form.price} onChange={(e) => set("price")(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick">Brza prodaja (€)</Label>
                <Input id="quick" inputMode="decimal" value={form.quick} onChange={(e) => set("quick")(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min">Najniža prihvatljiva (€)</Label>
                <Input id="min" inputMode="decimal" value={form.min} onChange={(e) => set("min")(e.target.value)} />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="rationale">Obrazloženje</Label>
              <Textarea
                id="rationale"
                rows={3}
                value={form.rationale}
                onChange={(e) => set("rationale")(e.target.value)}
              />
            </div>
            {data.item.cost != null ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Nabavna cijena: {formatEur(data.item.cost)}
              </p>
            ) : null}
          </section>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => persist.mutate(false)}
              disabled={persist.isPending}
            >
              <Save className="size-4" /> Spremi skicu
            </Button>
            <Button onClick={() => persist.mutate(true)} disabled={persist.isPending}>
              {persist.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Odobri oglas
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
