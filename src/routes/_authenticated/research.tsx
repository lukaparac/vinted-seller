import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSessionUser } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { requireUserId } from "@/lib/items";
import { suggestComparables } from "@/lib/research.functions";
import { formatDate, formatEur } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/research")({
  head: () => ({
    meta: [
      { title: "Istraživanje cijena — Vinted Seller OS" },
      { name: "description", content: "Bilježite usporedive oglase i pratite tržišne cijene." },
      { property: "og:title", content: "Istraživanje cijena — Vinted Seller OS" },
      {
        property: "og:description",
        content: "Bilježite usporedive oglase i pratite tržišne cijene.",
      },
    ],
  }),
  component: Research,
});

function Research() {
  const qc = useQueryClient();
  const { data: user } = useSessionUser();
  const suggest = useServerFn(suggestComparables);

  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ title: "", url: "", price: "", notes: "" });
  const [error, setError] = useState<string | null>(null);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["research"],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from("pricing_research")
        .select("*")
        .order("created_at", { ascending: false });
      if (err) throw err;
      return data;
    },
  });

  const research = useMutation({
    mutationFn: () => suggest({ data: { query } }),
    onError: () => toast.error("Prijedloge nije bilo moguće dohvatiti."),
  });

  const add = useMutation({
    mutationFn: async (input: { title: string; url: string | null; price: number; notes: string | null }) => {
      const userId = await requireUserId();
      const { error: err } = await supabase.from("pricing_research").insert({
        user_id: userId,
        comparable_title: input.title,
        source_url: input.url,
        observed_price: input.price,
        notes: input.notes,
      });
      if (err) throw err;
    },
    onSuccess: () => {
      setForm({ title: "", url: "", price: "", notes: "" });
      setError(null);
      toast.success("Zapis je spremljen.");
      qc.invalidateQueries({ queryKey: ["research"] });
    },
    onError: () => setError("Zapis nije bilo moguće spremiti."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error: err } = await supabase.from("pricing_research").delete().eq("id", id);
      if (err) throw err;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["research"] }),
    onError: () => toast.error("Brisanje nije uspjelo."),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(form.price.replace(",", "."));
    if (form.title.trim().length < 3) return setError("Naslov usporedivog oglasa je prekratak.");
    if (!(price > 0)) return setError("Uočena cijena mora biti broj veći od 0.");
    if (form.url && !/^https?:\/\//i.test(form.url)) return setError("Poveznica mora početi s http(s)://");
    add.mutate({
      title: form.title.trim(),
      url: form.url || null,
      price,
      notes: form.notes || null,
    });
  }

  return (
    <AppShell
      title="Istraživanje cijena"
      description="Ručno bilježenje usporedivih oglasa. Podaci su tržišna orijentacija, ne jamstvo prodajne cijene."
      email={user?.email}
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="panel p-6">
            <h2 className="text-xl">Prijedlozi</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Demo prijedlozi iz lokalnog modula. Pripremljeno za kasniju web-pretragu.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="relative min-w-56 flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  className="pl-9"
                  placeholder="npr. Levi's traper jakna L"
                  aria-label="Pojam za istraživanje"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Button
                onClick={() => research.mutate()}
                disabled={query.trim().length < 2 || research.isPending}
              >
                {research.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Pretraži
              </Button>
            </div>

            {research.data && research.data.length > 0 ? (
              <ul className="mt-5 space-y-2">
                {research.data.map((c, i) => (
                  <li
                    key={`${c.title}-${i}`}
                    className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface px-4 py-3"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm">{c.title}</span>
                    <span className="text-sm font-medium">{formatEur(c.observedPrice)}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setForm({
                          title: c.title,
                          url: c.sourceUrl ?? "",
                          price: String(c.observedPrice),
                          notes: c.notes ?? "",
                        })
                      }
                    >
                      Prenesi u obrazac
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="panel overflow-x-auto">
            {isLoading ? (
              <div className="space-y-2 p-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-md" />
                ))}
              </div>
            ) : (rows ?? []).length === 0 ? (
              <EmptyState
                title="Nema zapisa istraživanja"
                description="Dodajte usporedive oglase koje ste pronašli kako biste bolje odredili cijenu."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usporedivi oglas</TableHead>
                    <TableHead className="text-right">Cijena</TableHead>
                    <TableHead>Provjereno</TableHead>
                    <TableHead>Bilješka</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(rows ?? []).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="max-w-72">
                        {row.source_url ? (
                          <a
                            href={row.source_url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="line-clamp-1 underline underline-offset-4"
                          >
                            {row.comparable_title}
                          </a>
                        ) : (
                          <span className="line-clamp-1">{row.comparable_title}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatEur(row.observed_price)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(row.checked_at)}
                      </TableCell>
                      <TableCell className="max-w-64 text-sm text-muted-foreground">
                        <span className="line-clamp-1">{row.notes ?? "—"}</span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Obriši zapis ${row.comparable_title}`}
                          onClick={() => remove.mutate(row.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        </div>

        <form onSubmit={submit} className="panel h-fit p-6" noValidate>
          <h2 className="text-xl">Novi zapis</h2>
          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="r-title">Naslov usporedivog oglasa</Label>
              <Input
                id="r-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-url">Poveznica (neobavezno)</Label>
              <Input
                id="r-url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-price">Uočena cijena (€)</Label>
              <Input
                id="r-price"
                inputMode="decimal"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-notes">Bilješka</Label>
              <Textarea
                id="r-notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          {error ? (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="mt-6 w-full" disabled={add.isPending}>
            <Plus className="size-4" /> Spremi zapis
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
