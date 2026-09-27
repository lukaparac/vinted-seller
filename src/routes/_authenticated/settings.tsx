import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfile, useSessionUser } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { TONES } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Postavke — Vinted Seller OS" },
      { name: "description", content: "Profil prodavača, valuta, jezik i postavke cijena." },
      { property: "og:title", content: "Postavke — Vinted Seller OS" },
      {
        property: "og:description",
        content: "Profil prodavača, valuta, jezik i postavke cijena.",
      },
    ],
  }),
  component: Settings,
});

function Settings() {
  const qc = useQueryClient();
  const { data: user } = useSessionUser();
  const { data: profile, isLoading } = useProfile();

  const [form, setForm] = useState({
    display_name: "",
    shop_name: "",
    tone: "profesionalan",
    target_margin: "2.5",
    quick_sale_discount: "15",
    min_price_floor: "3",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setForm({
      display_name: profile.display_name ?? "",
      shop_name: profile.shop_name ?? "",
      tone: profile.tone ?? "profesionalan",
      target_margin: String(profile.target_margin ?? 2.5),
      quick_sale_discount: String(Math.round(Number(profile.quick_sale_discount ?? 0.15) * 100)),
      min_price_floor: String(profile.min_price_floor ?? 3),
    });
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Niste prijavljeni.");
      const margin = Number(form.target_margin.replace(",", "."));
      const discount = Number(form.quick_sale_discount.replace(",", "."));
      const floor = Number(form.min_price_floor.replace(",", "."));
      if (!(margin >= 1 && margin <= 10)) throw new Error("Ciljna marža mora biti između 1 i 10.");
      if (!(discount >= 0 && discount <= 60))
        throw new Error("Popust za brzu prodaju mora biti između 0 i 60 %.");
      if (!(floor >= 0 && floor <= 100)) throw new Error("Najniža cijena mora biti između 0 i 100 €.");

      const { error: err } = await supabase
        .from("profiles")
        .update({
          display_name: form.display_name || null,
          shop_name: form.shop_name || null,
          tone: form.tone,
          target_margin: margin,
          quick_sale_discount: discount / 100,
          min_price_floor: floor,
        })
        .eq("id", user.id);
      if (err) throw err;
    },
    onSuccess: () => {
      setError(null);
      toast.success("Postavke su spremljene.");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Spremanje nije uspjelo."),
  });

  return (
    <AppShell title="Postavke" description="Vaš profil i zadane vrijednosti oglasa." email={user?.email}>
      {isLoading ? (
        <Skeleton className="h-96 max-w-2xl rounded-lg" />
      ) : (
        <form
          className="max-w-2xl space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          noValidate
        >
          <section className="panel p-6">
            <h2 className="text-xl">Profil prodavača</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="display_name">Ime</Label>
                <Input
                  id="display_name"
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shop_name">Naziv trgovine</Label>
                <Input
                  id="shop_name"
                  value={form.shop_name}
                  onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Valuta</Label>
                <Input id="currency" value="EUR" readOnly aria-readonly="true" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Jezik oglasa</Label>
                <Input id="language" value="Hrvatski" readOnly aria-readonly="true" />
              </div>
            </div>
          </section>

          <section className="panel p-6">
            <h2 className="text-xl">Stil i cijene</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="tone">Ton oglasa</Label>
                <Select value={form.tone} onValueChange={(v) => setForm({ ...form, tone: v })}>
                  <SelectTrigger id="tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="margin">Ciljna marža (×)</Label>
                <Input
                  id="margin"
                  inputMode="decimal"
                  value={form.target_margin}
                  onChange={(e) => setForm({ ...form, target_margin: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Popust za brzu prodaju (%)</Label>
                <Input
                  id="discount"
                  inputMode="decimal"
                  value={form.quick_sale_discount}
                  onChange={(e) => setForm({ ...form, quick_sale_discount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">Najniža dopuštena cijena (€)</Label>
                <Input
                  id="floor"
                  inputMode="decimal"
                  value={form.min_price_floor}
                  onChange={(e) => setForm({ ...form, min_price_floor: e.target.value })}
                />
              </div>
            </div>
          </section>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Spremi postavke
          </Button>
        </form>
      )}
    </AppShell>
  );
}
