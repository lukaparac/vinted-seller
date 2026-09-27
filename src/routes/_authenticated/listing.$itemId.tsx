import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Download, Pencil } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSessionUser } from "@/hooks/use-profile";
import { useSignedImages } from "@/hooks/use-signed-images";
import { supabase } from "@/integrations/supabase/client";
import { fetchItem } from "@/lib/items";
import { STATUS_LABEL, STATUS_ORDER, formatDate, formatEur } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/listing/$itemId")({
  head: () => ({
    meta: [
      { title: "Detalji oglasa — Vinted Seller OS" },
      { name: "description", content: "Kopirajte i izvezite podatke oglasa za ručnu objavu." },
      { property: "og:title", content: "Detalji oglasa — Vinted Seller OS" },
      {
        property: "og:description",
        content: "Kopirajte i izvezite podatke oglasa za ručnu objavu.",
      },
    ],
  }),
  component: ListingDetail,
});

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} kopirano.`);
  } catch {
    toast.error("Kopiranje nije uspjelo.");
  }
}

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function ListingDetail() {
  const { itemId } = Route.useParams();
  const qc = useQueryClient();
  const { data: user } = useSessionUser();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["item", itemId],
    queryFn: () => fetchItem(itemId),
  });

  const { data: versions } = useQuery({
    queryKey: ["versions", itemId, data?.listing?.id],
    enabled: Boolean(data?.listing?.id),
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("listing_versions")
        .select("*")
        .eq("listing_id", data!.listing!.id)
        .order("version", { ascending: false });
      if (error) throw error;
      return rows;
    },
  });

  const signed = useSignedImages((data?.images ?? []).map((i) => i.storage_path));

  const changeStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from("items").update({ status }).eq("id", itemId);
      if (error) throw error;
      if (user) {
        await supabase.from("activity_log").insert({
          user_id: user.id,
          item_id: itemId,
          action: "Status promijenjen",
          detail: STATUS_LABEL[status as keyof typeof STATUS_LABEL],
        });
      }
    },
    onSuccess: () => {
      toast.success("Status je ažuriran.");
      qc.invalidateQueries({ queryKey: ["item", itemId] });
      qc.invalidateQueries({ queryKey: ["items"] });
    },
    onError: () => toast.error("Status nije bilo moguće promijeniti."),
  });

  if (isLoading) {
    return (
      <AppShell title="Oglas" email={user?.email}>
        <Skeleton className="h-96 rounded-lg" />
      </AppShell>
    );
  }
  if (isError || !data) {
    return (
      <AppShell title="Oglas" email={user?.email}>
        <div className="panel p-6">
          <p className="text-sm text-destructive">Oglas nije pronađen.</p>
        </div>
      </AppShell>
    );
  }

  const { item, listing, images } = data;
  const record = {
    sku: item.sku,
    naslov: listing?.title ?? item.title,
    opis: listing?.description ?? "",
    kljucne_rijeci: (listing?.keywords ?? []).join(", "),
    brand: item.brand,
    model: item.model,
    kategorija: item.category,
    potkategorija: item.subcategory,
    boja: item.color,
    materijal: item.material,
    velicina: item.size,
    stanje: item.condition,
    nedostaci: item.flaws,
    nabavna_cijena: item.cost,
    preporucena_cijena: listing?.recommended_price ?? item.price,
    brza_prodaja: listing?.quick_sale_price ?? item.quick_sale_price,
    najniza_cijena: listing?.min_price ?? item.min_price,
    status: STATUS_LABEL[item.status as keyof typeof STATUS_LABEL],
  };

  const allText = Object.entries(record)
    .map(([k, v]) => `${k}: ${v ?? "—"}`)
    .join("\n");

  return (
    <AppShell
      title={item.sku ?? "Oglas"}
      description={item.title}
      email={user?.email}
      actions={
        <div className="flex items-center gap-2">
          <Select value={item.status} onValueChange={(v) => changeStatus.mutate(v)}>
            <SelectTrigger className="w-40" aria-label="Promijeni status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild variant="outline">
            <Link to="/workspace/$itemId" params={{ itemId }}>
              <Pencil className="size-4" /> Uredi
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <div className="panel p-4">
            <h2 className="text-overline">Fotografije</h2>
            {images.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nema fotografija.</p>
            ) : (
              <ul className="mt-3 grid grid-cols-2 gap-2">
                {images.map((img, i) => (
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

          <div className="panel space-y-2 p-4">
            <h2 className="text-overline">Izvoz</h2>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => copy(record.naslov ?? "", "Naslov")}
            >
              <Copy className="size-4" /> Kopiraj naslov
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => copy(record.opis, "Opis")}
            >
              <Copy className="size-4" /> Kopiraj opis
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => copy(allText, "Svi podaci")}
            >
              <Copy className="size-4" /> Kopiraj sve podatke
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() =>
                download(
                  `${item.sku}.json`,
                  JSON.stringify(record, null, 2),
                  "application/json",
                )
              }
            >
              <Download className="size-4" /> Preuzmi JSON
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() =>
                download(
                  `${item.sku}.csv`,
                  `${Object.keys(record).join(",")}\n${Object.values(record).map(csvCell).join(",")}`,
                  "text/csv",
                )
              }
            >
              <Download className="size-4" /> Preuzmi CSV
            </Button>
          </div>
        </aside>

        <div className="space-y-6">
          <section className="panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl">{record.naslov}</h2>
              <StatusBadge status={item.status} />
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-overline">Preporučena</p>
                <p className="mt-1 text-display text-2xl">{formatEur(record.preporucena_cijena)}</p>
              </div>
              <div>
                <p className="text-overline">Brza prodaja</p>
                <p className="mt-1 text-display text-2xl">{formatEur(record.brza_prodaja)}</p>
              </div>
              <div>
                <p className="text-overline">Najniža</p>
                <p className="mt-1 text-display text-2xl">{formatEur(record.najniza_cijena)}</p>
              </div>
            </div>
            {listing?.pricing_rationale ? (
              <p className="mt-4 text-sm text-muted-foreground">{listing.pricing_rationale}</p>
            ) : null}
          </section>

          <section className="panel p-6">
            <h2 className="text-xl">Podaci artikla</h2>
            <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {(
                [
                  ["Brand", item.brand],
                  ["Model / tip", item.model],
                  ["Kategorija", item.category],
                  ["Potkategorija", item.subcategory],
                  ["Boja", item.color],
                  ["Materijal", item.material],
                  ["Veličina", item.size],
                  ["Stanje", item.condition],
                  ["Nabavna cijena", formatEur(item.cost)],
                  ["Dodano", formatDate(item.created_at)],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-border/60 pb-2">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="text-sm font-medium">{value || "—"}</dd>
                </div>
              ))}
            </dl>
            {item.flaws ? (
              <p className="mt-4 text-sm">
                <span className="text-muted-foreground">Nedostaci: </span>
                {item.flaws}
              </p>
            ) : null}
          </section>

          <section className="panel p-6">
            <h2 className="text-xl">Opis</h2>
            {listing?.description ? (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{listing.description}</p>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Opis još nije generiran. Otvorite AI radni prostor.
              </p>
            )}
            {listing?.keywords?.length ? (
              <ul className="mt-5 flex flex-wrap gap-2">
                {listing.keywords.map((k) => (
                  <li
                    key={k}
                    className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground"
                  >
                    {k}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="panel p-6">
            <h2 className="text-xl">Povijest izmjena</h2>
            {versions && versions.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {versions.map((v) => (
                  <li key={v.id} className="flex items-center justify-between border-b border-border/60 pb-2 text-sm">
                    <span>
                      v{v.version} · {v.change_note ?? "Izmjena"}
                    </span>
                    <span className="text-muted-foreground">{formatDate(v.created_at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Još nema zabilježenih verzija.</p>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
