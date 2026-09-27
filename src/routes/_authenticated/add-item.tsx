import { useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSessionUser } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { requireUserId } from "@/lib/items";
import { CATEGORIES, CONDITIONS } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/add-item")({
  head: () => ({
    meta: [
      { title: "Dodaj artikl — Vinted Seller OS" },
      { name: "description", content: "Učitajte fotografije i pripremite novi oglas." },
      { property: "og:title", content: "Dodaj artikl — Vinted Seller OS" },
      { property: "og:description", content: "Učitajte fotografije i pripremite novi oglas." },
    ],
  }),
  component: AddItem,
});

const MAX_FILES = 12;
const MAX_SIZE = 15 * 1024 * 1024;

function AddItem() {
  const navigate = useNavigate();
  const { data: user } = useSessionUser();
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [size, setSize] = useState("");
  const [condition, setCondition] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const accepted: File[] = [];
    for (const file of Array.from(incoming)) {
      if (!file.type.startsWith("image/")) {
        setError("Dozvoljene su samo slikovne datoteke.");
        continue;
      }
      if (file.size > MAX_SIZE) {
        setError(`Datoteka ${file.name} je veća od 15 MB.`);
        continue;
      }
      accepted.push(file);
    }
    const next = [...files, ...accepted].slice(0, MAX_FILES);
    setFiles(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
    if (accepted.length) setError(null);
  }

  function removeFile(index: number) {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) {
      setError("Dodajte barem jednu fotografiju artikla.");
      return;
    }
    if (cost && Number.isNaN(Number(cost.replace(",", ".")))) {
      setError("Nabavna cijena mora biti broj.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const userId = await requireUserId();
      const { data: item, error: itemError } = await supabase
        .from("items")
        .insert({
          user_id: userId,
          title: brand ? `${brand} — novi artikl` : "Novi artikl",
          brand: brand || null,
          category: category || null,
          size: size || null,
          condition: condition || null,
          cost: cost ? Number(cost.replace(",", ".")) : null,
          notes: notes || null,
          status: "draft",
        })
        .select("*")
        .single();
      if (itemError) throw itemError;

      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${userId}/${item.id}/${Date.now()}-${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("item-photos")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;

        const { error: rowError } = await supabase.from("item_images").insert({
          item_id: item.id,
          user_id: userId,
          storage_path: path,
          position: i,
        });
        if (rowError) throw rowError;
      }

      await supabase.from("activity_log").insert({
        user_id: userId,
        item_id: item.id,
        action: "Artikl kreiran",
        detail: `${files.length} fotografija`,
      });

      toast.success("Artikl je kreiran.");
      navigate({ to: "/workspace/$itemId", params: { itemId: item.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Spremanje nije uspjelo.");
      setBusy(false);
    }
  }

  return (
    <AppShell
      title="Dodaj artikl"
      description="Jedna grupa fotografija = jedan artikl. Naznake su neobavezne, ali poboljšavaju rezultat."
      email={user?.email}
    >
      <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.4fr_1fr]" noValidate>
        <section className="panel p-6">
          <h2 className="text-xl">Fotografije</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Do {MAX_FILES} fotografija, najviše 15 MB po datoteci.
          </p>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            className={`mt-5 rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
              dragging ? "border-accent bg-accent/5" : "border-border bg-surface/50"
            }`}
          >
            <ImagePlus className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">
              Povucite fotografije ovdje ili ih odaberite.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => inputRef.current?.click()}
            >
              Odaberi fotografije
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              aria-label="Odaberi fotografije"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          {previews.length > 0 ? (
            <ul className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {previews.map((src, i) => (
                <li key={src} className="group relative overflow-hidden rounded-md border border-border">
                  <img src={src} alt={`Fotografija ${i + 1}`} className="aspect-square w-full object-cover" />
                  <button
                    type="button"
                    aria-label={`Ukloni fotografiju ${i + 1}`}
                    onClick={() => removeFile(i)}
                    className="absolute right-1 top-1 rounded-md bg-background/90 p-1.5 text-muted-foreground opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="panel h-fit p-6">
          <h2 className="text-xl">Naznake (neobavezno)</h2>

          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="npr. COS" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategorija</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Odaberite kategoriju" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="size">Veličina</Label>
                <Input id="size" value={size} onChange={(e) => setSize(e.target.value)} placeholder="M" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Nabavna cijena (€)</Label>
                <Input
                  id="cost"
                  inputMode="decimal"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="6"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">Stanje</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger id="condition">
                  <SelectValue placeholder="Odaberite stanje" />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Bilješke</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mjere, posebne napomene…"
                rows={3}
              />
            </div>
          </div>

          {error ? (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="mt-6 w-full" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {busy ? "Spremam…" : "Analiziraj s AI"}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Analiza koristi samo vaše fotografije i unesene podatke.
          </p>
        </section>
      </form>
    </AppShell>
  );
}
