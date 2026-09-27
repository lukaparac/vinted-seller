import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Prijava — Vinted Seller APP" },
      {
        name: "description",
        content: "Prijavite se u svoj privatni radni prostor za pripremu Vinted oglasa.",
      },
      { property: "og:title", content: "Prijava — Vinted Seller APP" },
      {
        property: "og:description",
        content: "Privatni radni prostor za pripremu i vođenje Vinted oglasa.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  function validate(): string | null {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Unesite ispravnu e-mail adresu.";
    if (password.length < 8) return "Lozinka mora imati barem 8 znakova.";
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problem = validate();
    setError(problem);
    if (problem) return;

    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (err) throw err;
        if (data.session) {
          navigate({ to: "/dashboard" });
        } else {
          toast.success("Provjerite e-mail i potvrdite registraciju.");
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Prijava nije uspjela.";
      setError(
        message.toLowerCase().includes("invalid login")
          ? "Neispravna e-mail adresa ili lozinka."
          : message,
      );
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      setError("Prijava putem Googlea trenutno nije dostupna.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-12 lg:flex">
        <Link to="/" className="text-overline text-sidebar-foreground/60">
          Vinted Seller APP
        </Link>
        <div>
          <h2 className="text-display text-4xl text-sidebar-primary-foreground">
            Fotografije unutra,
            <br />
            spreman oglas van.
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-sidebar-foreground/70">
            AI priprema naslov, opis i prijedlog cijene. Vi pregledavate, uređujete i odobravate —
            objava na Vintedu ostaje u vašim rukama.
          </p>
        </div>
        <p className="text-[11px] text-sidebar-foreground/45">
          Aplikacija ne pristupa Vintedu i ne objavljuje oglase automatski.
        </p>
      </div>

      <div className="flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl">{mode === "signin" ? "Prijava" : "Otvorite račun"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Vaš radni prostor je privatan i vidljiv samo vama.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vi@primjer.hr"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Lozinka</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Najmanje 8 znakova"
                required
              />
            </div>

            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {mode === "signin" ? "Prijavi se" : "Registriraj se"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> ili <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={google} disabled={busy}>
            Nastavi s Google računom
          </Button>

          <button
            type="button"
            className="mt-6 w-full text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
            }}
          >
            {mode === "signin" ? "Nemate račun? Registrirajte se" : "Već imate račun? Prijavite se"}
          </button>
        </div>
      </div>
    </div>
  );
}
