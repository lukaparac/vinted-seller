import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSessionUser } from "@/hooks/use-profile";
import { fetchItems } from "@/lib/items";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_LABEL, STATUS_ORDER, formatDate, formatEur } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({
    meta: [
      { title: "Inventar — Vinted Seller OS" },
      { name: "description", content: "Svi artikli, statusi, cijene i troškovi na jednom mjestu." },
      { property: "og:title", content: "Inventar — Vinted Seller OS" },
      {
        property: "og:description",
        content: "Svi artikli, statusi, cijene i troškovi na jednom mjestu.",
      },
    ],
  }),
  component: Inventory,
});

function Inventory() {
  const qc = useQueryClient();
  const { data: user } = useSessionUser();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["items"], queryFn: fetchItems });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter((item) => {
      const matchStatus = status === "all" || item.status === status;
      const matchTerm =
        !term ||
        [item.sku, item.title, item.brand, item.category]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term));
      return matchStatus && matchTerm;
    });
  }, [data, search, status]);

  const bulk = useMutation({
    mutationFn: async (next: string) => {
      const { error } = await supabase.from("items").update({ status: next }).in("id", selected);
      if (error) throw error;
    },
    onSuccess: (_r, next) => {
      toast.success(`Status promijenjen u „${STATUS_LABEL[next as keyof typeof STATUS_LABEL]}”.`);
      setSelected([]);
      setBulkStatus("");
      qc.invalidateQueries({ queryKey: ["items"] });
    },
    onError: () => toast.error("Promjena statusa nije uspjela."),
  });

  const allSelected = rows.length > 0 && selected.length === rows.length;

  return (
    <AppShell
      title="Inventar"
      description="Pretražujte, filtrirajte i mijenjajte statuse artikala."
      email={user?.email}
      actions={
        <Button asChild>
          <Link to="/add-item">
            <Plus className="size-4" /> Dodaj artikl
          </Link>
        </Button>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            className="pl-9"
            placeholder="Traži po SKU, naslovu, brandu…"
            aria-label="Pretraga artikala"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48" aria-label="Filtriraj po statusu">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Svi statusi</SelectItem>
            {STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selected.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3">
          <span className="text-sm">Odabrano: {selected.length}</span>
          <Select value={bulkStatus} onValueChange={setBulkStatus}>
            <SelectTrigger className="w-48" aria-label="Novi status za odabrano">
              <SelectValue placeholder="Promijeni status u…" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" disabled={!bulkStatus || bulk.isPending} onClick={() => bulk.mutate(bulkStatus)}>
            Primijeni
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
            Poništi odabir
          </Button>
        </div>
      ) : null}

      <div className="mt-6">
        {isError ? (
          <div className="panel p-6">
            <p className="text-sm text-destructive">Inventar nije bilo moguće učitati.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
              Pokušaj ponovno
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-md" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title={data?.length ? "Nema rezultata" : "Inventar je prazan"}
            description={
              data?.length
                ? "Promijenite pojam pretrage ili filtar statusa."
                : "Dodajte prvi artikl i pripremite oglas."
            }
            action={
              data?.length ? null : (
                <Button asChild>
                  <Link to="/add-item">Dodaj artikl</Link>
                </Button>
              )
            }
          />
        ) : (
          <div className="panel overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      aria-label="Odaberi sve"
                      checked={allSelected}
                      onCheckedChange={(v) => setSelected(v ? rows.map((r) => r.id) : [])}
                    />
                  </TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Naslov</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Kategorija</TableHead>
                  <TableHead className="text-right">Trošak</TableHead>
                  <TableHead className="text-right">Cijena</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dodano</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox
                        aria-label={`Odaberi ${item.sku}`}
                        checked={selected.includes(item.id)}
                        onCheckedChange={(v) =>
                          setSelected((prev) =>
                            v ? [...prev, item.id] : prev.filter((id) => id !== item.id),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {item.sku}
                    </TableCell>
                    <TableCell className="max-w-72">
                      <Link
                        to="/listing/$itemId"
                        params={{ itemId: item.id }}
                        className="line-clamp-1 font-medium underline-offset-4 hover:underline"
                      >
                        {item.title}
                      </Link>
                    </TableCell>
                    <TableCell>{item.brand ?? "—"}</TableCell>
                    <TableCell>{item.category ?? "—"}</TableCell>
                    <TableCell className="text-right">{formatEur(item.cost)}</TableCell>
                    <TableCell className="text-right font-medium">{formatEur(item.price)}</TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(item.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
