import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  PlusCircle,
  Boxes,
  LineChart,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/add-item", label: "Dodaj artikl", icon: PlusCircle },
  { to: "/inventory", label: "Inventar", icon: Boxes },
  { to: "/research", label: "Istraživanje", icon: LineChart },
  { to: "/settings", label: "Postavke", icon: SettingsIcon },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Glavna navigacija">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          activeProps={{
            className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
          }}
        >
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function SidebarInner({ email, onNavigate }: { email?: string; onNavigate?: () => void }) {
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="flex h-full flex-col justify-between p-5">
      <div>
        <Link to="/dashboard" onClick={onNavigate} className="block">
          <span className="text-overline text-sidebar-foreground/60">Vinted</span>
          <span className="block text-display text-2xl text-sidebar-primary-foreground">
            Seller OS
          </span>
        </Link>
        <div className="mt-8">
          <NavList onNavigate={onNavigate} />
        </div>
      </div>

      <div className="space-y-3 border-t border-sidebar-border pt-4">
        <p className="truncate text-xs text-sidebar-foreground/60">{email ?? "—"}</p>
        <p className="text-[11px] leading-relaxed text-sidebar-foreground/45">
          Oglasi se pripremaju ovdje, a objavljujete ih ručno na Vintedu.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start gap-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-4" aria-hidden="true" /> Odjava
        </Button>
      </div>
    </div>
  );
}

export function AppShell({
  title,
  description,
  actions,
  email,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  email?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="hidden w-64 shrink-0 bg-sidebar lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarInner email={email} />
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Zatvori izbornik"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-sidebar">
            <button
              type="button"
              aria-label="Zatvori izbornik"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 text-sidebar-foreground/70"
            >
              <X className="size-5" />
            </button>
            <SidebarInner email={email} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex flex-wrap items-center gap-4 px-5 py-5 lg:px-10">
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              aria-label="Otvori izbornik"
              onClick={() => setOpen(true)}
            >
              <Menu className="size-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl lg:text-3xl">{title}</h1>
              {description ? (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
          </div>
        </header>

        <main className={cn("flex-1 px-5 py-8 lg:px-10 lg:py-10")}>{children}</main>
      </div>
    </div>
  );
}
