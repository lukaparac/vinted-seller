import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Camera, ClipboardCheck, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vinted Seller APP — priprema oglasa uz AI" },
      {
        name: "description",
        content:
          "Pretvorite fotografije u spremne Vinted oglase: AI priprema naslov, opis i cijenu, vi odobravate i objavljujete ručno.",
      },
      { property: "og:title", content: "Vinted Seller APP — priprema oglasa uz AI" },
      {
        property: "og:description",
        content:
          "Radni prostor za resale prodavače: priprema oglasa, cjenovne smjernice i vođenje zaliha.",
      },
    ],
  }),
  component: Landing,
});

const STEPS = [
  {
    icon: Camera,
    title: "Učitajte fotografije",
    text: "Povucite fotografije jednog artikla i po želji dodajte brand, veličinu i stanje.",
  },
  {
    icon: Tags,
    title: "AI priprema oglas",
    text: "Naslov, opis na hrvatskom, ključne riječi i tri razine cijene s obrazloženjem.",
  },
  {
    icon: ClipboardCheck,
    title: "Vi odobravate",
    text: "Uredite što želite, kopirajte tekst i objavite ručno na Vintedu. Bez automatike.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-display text-xl">Vinted Seller APP</span>
        <Button asChild variant="ghost" size="sm">
          <Link to="/auth">Prijava</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="border-b border-border py-20 lg:py-28">
          <p className="text-overline">Radni prostor za resale prodavače</p>
          <h1 className="mt-5 max-w-3xl text-5xl leading-[1.05] lg:text-7xl">
            Fotografije unutra, <em className="not-italic text-accent">spreman oglas</em> van.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            Vinted Seller APP priprema naslov, opis i prijedlog cijene za svaki artikl, vodi vaše
            zalihe i čuva povijest izmjena. Objavu na Vintedu radite sami — aplikacija ne pristupa
            Vintedu niti objavljuje umjesto vas.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">
                Otvori radni prostor <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-6 py-16 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="panel p-6">
              <span className="text-overline">0{i + 1}</span>
              <Icon className="mt-4 size-5 text-accent" aria-hidden="true" />
              <h2 className="mt-4 text-xl">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="mx-auto max-w-6xl border-t border-border px-6 py-10 text-xs text-muted-foreground">
        Vinted Seller APP nije povezan s Vintedom. Cjenovne smjernice su tržišna orijentacija, ne
        jamstvo prodajne cijene.
      </footer>
    </div>
  );
}
