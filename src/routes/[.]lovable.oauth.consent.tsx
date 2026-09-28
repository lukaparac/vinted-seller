import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type OAuthResult = { data: any; error: { message: string } | null };
const oauth = (supabase.auth as unknown as {
  oauth: {
    getAuthorizationDetails(id: string): Promise<OAuthResult>;
    approveAuthorization(id: string): Promise<OAuthResult>;
    denyAuthorization(id: string): Promise<OAuthResult>;
  };
}).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Povezivanje aplikacije — Vinted Seller APP" },
      { name: "description", content: "Odobrite pristup AI asistentu vašem radnom prostoru." },
      { property: "og:title", content: "Povezivanje aplikacije — Vinted Seller APP" },
      { property: "og:description", content: "Odobrite pristup AI asistentu vašem radnom prostoru." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s["authorization_id"] === "string" ? s["authorization_id"] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Nedostaje authorization_id.");
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth", search: { next: location.href } });
  },
  loader: async ({ location }) => {
    const id = new URLSearchParams(location.searchStr).get("authorization_id")!;
    const { data, error } = await oauth.getAuthorizationDetails(id);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md p-10 text-sm text-destructive">
      Zahtjev za povezivanje nije moguće učitati: {String((error as Error)?.message ?? error)}
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = details?.client?.name ?? "Aplikacija";

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorization_id)
      : await oauth.denyAuthorization(authorization_id);
    if (error) { setBusy(false); setError(error.message); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); setError("Poslužitelj nije vratio adresu za nastavak."); return; }
    window.location.href = target;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="panel w-full max-w-md space-y-5 p-8">
        <p className="text-overline">Vinted Seller APP</p>
        <h1 className="text-display text-3xl">Povezati {name}?</h1>
        <p className="text-sm text-muted-foreground">
          {name} će moći čitati vaš inventar i oglase te mijenjati status artikala u vaše ime.
          Ništa se ne objavljuje na Vintedu.
        </p>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-3">
          <Button disabled={busy} onClick={() => decide(true)}>Odobri</Button>
          <Button variant="outline" disabled={busy} onClick={() => decide(false)}>Odbij</Button>
        </div>
      </div>
    </main>
  );
}
