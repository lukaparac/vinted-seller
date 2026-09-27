import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionUser } from "@/hooks/use-profile";
import { fetchItems } from "@/lib/items";
import { seedDemoData } from "@/lib/demo";
import { formatDate, formatEur } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Vinted Seller APP" },
      { name: "description", content: "Pregled zaliha, skica i spremnih oglasa." },
      { property: "og:title", content: "Dashboard — Vinted Seller APP" },
      { property: "og:description", content: "Pregled zaliha, skica i spremnih oglasa." },
    ],
  }),
  component: Dashboard,
});

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="panel p-5">
      <p className="text-overline">{label}</p>
      <p className="mt-3 text-display text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Dashboard() {
  const qc = useQueryClient();
  const { data: user } = useSessionUser();
  const { data: items, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["items"],
    queryFn: fetchItems,
  });

  const seed = useMutation({
    mutationFn: seedDemoData,
    onSuccess: () => {
      toast.success("Demo artikli su dodani.");
      qc.invalidateQueries({ queryKey: ["items"] });
    },
    onError: () => toast.error("Demo podatke nije bilo moguće dodati."),
  });

  const list = items ?? [];
  const count = (status: string) => list.filter((i) => i.status === status).length;
  const inventoryValue = list
    .filter((i) => !["sold", "shipped"].includes(i.status))
    .reduce((sum, i) => sum + Number(i.price ?? 0), 0);

  return (
    <AppShell
      title="Dashboard"
      description="Pregled vašeg resale poslovanja."
      email={user?.email}
      actions={
        <Button asChild>
          <Link to="/add-item">
            <Plus className="size-4" /> Dodaj artikl
          </Link>
        </Button>
      }
    >
      {isError ? (
        <div className="panel p-6">
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Podatke nije bilo moguće učitati."}
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
            Pokušaj ponovno
          </Button>
        </div>
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Kpi label="Skice" value={String(count("draft"))} />
            <Kpi label="Spremno za objavu" value={String(count("ready"))} />
            <Kpi
              label="Aktivno"
              value={String(count("listed") + count("reserved"))}
              hint="Objavljeno i rezervirano"
            />
            <Kpi label="Prodano" value={String(count("sold") + count("shipped"))} />
            <Kpi
              label="Procijenjena vrijednost"
              value={formatEur(inventoryValue)}
              hint="Zbroj cijena aktivnih artikala"
            />
          </div>

          <section className="mt-10">
            <div className="mb-4 flex items-end justify-between">
              <h2 className="text-2xl">Nedavni artikli</h2>
              {list.length > 0 ? (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/inventory">Sve u inventaru</Link>
                </Button>
              ) : null}
            </div>

            {list.length === 0 ? (
              <EmptyState
                title="Još nema artikala"
                description="Dodajte prvi artikl s fotografijama ili učitajte nekoliko demo artikala da vidite kako radni prostor izgleda."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button asChild>
                      <Link to="/add-item">
                        <Plus className="size-4" /> Dodaj artikl
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => seed.mutate()}
                      disabled={seed.isPending}
                    >
                      {seed.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Sparkles className="size-4" />
                      )}
                      Učitaj demo podatke
                    </Button>
                  </div>
                }
              />
            ) : (
              <ul className="grid gap-3">
                {list.slice(0, 6).map((item) => (
                  <li key={item.id}>
                    <Link
                      to="/listing/$itemId"
                      params={{ itemId: item.id }}
                      className="panel flex flex-wrap items-center gap-4 p-4 transition-shadow hover:shadow-[var(--shadow-lift)]"
                    >
                      <span className="font-mono text-xs text-muted-foreground">{item.sku}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {item.title}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(item.created_at)}
                      </span>
                      <span className="text-sm font-medium">{formatEur(item.price)}</span>
                      <StatusBadge status={item.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
