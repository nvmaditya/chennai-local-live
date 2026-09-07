import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { clockLabel, weekdayShort } from "@/lib/transit/time";
import { cn } from "@/lib/utils";

type NavItem =
  | { to: "/"; label: string; params?: undefined }
  | { to: "/line/$id"; label: string; params: { id: string } }
  | { to: "/coach-guide"; label: string; params?: undefined }
  | { to: "/about"; label: string; params?: undefined };

const NAV: NavItem[] = [
  { to: "/", label: "Network" },
  { to: "/line/$id", params: { id: "south" }, label: "Lines" },
  { to: "/coach-guide", label: "Rakes" },
  { to: "/about", label: "About" },
];

export function AppShell({
  children,
  source,
}: {
  children: React.ReactNode;
  source?: "SCHEDULE_SIM" | "NTES" | "STATION_BOARD" | "STALE";
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const sim = source !== "NTES";

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bg text-fg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-elevated focus:px-3 focus:py-2"
      >
        Skip to map
      </a>
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-3 py-2">
          <Link to="/" className="flex min-w-0 items-center gap-2.5" preload="intent">
            <span className="grid h-8 w-8 place-items-center rounded-sm bg-elevated ring-1 ring-border-strong">
              <span className="font-mono text-sm font-semibold tracking-tight">CL</span>
            </span>
            <span className="min-w-0">
              <span className="block truncate font-semibold leading-tight tracking-tight">Chennai Local Live</span>
              <span className="hidden truncate text-xs text-muted sm:block">Unofficial · estimates only</span>
            </span>
          </Link>
          <nav className="ml-2 hidden items-center gap-1 md:flex">
            {NAV.map((n) => {
              const active =
                n.to === "/"
                  ? pathname === "/"
                  : n.to === "/line/$id"
                    ? pathname.startsWith("/line/")
                    : pathname.startsWith(n.to);
              return (
                <Link
                  key={n.label}
                  to={n.to}
                  params={n.params}
                  preload="intent"
                  className={cn(
                    "rounded-sm px-3 py-1.5 text-sm transition-colors duration-150",
                    active ? "bg-elevated text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LiveClock sim={sim} />
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-sm text-fg md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        {open ? (
          <nav className="border-t border-border px-3 py-2 md:hidden">
            {NAV.map((n) => (
              <Link
                key={n.label}
                to={n.to}
                params={n.params}
                preload="intent"
                onClick={() => setOpen(false)}
                className="block rounded-sm px-3 py-3 text-sm text-fg"
              >
                {n.label}
              </Link>
            ))}
            <div className="px-3 py-2">
              <LiveClock sim={sim} compact />
            </div>
          </nav>
        ) : null}
      </header>
      <div id="main" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

const LiveClock = memo(function LiveClock({ sim, compact }: { sim: boolean; compact?: boolean }) {
  const [clock, setClock] = useState("");
  const [day, setDay] = useState("");

  useEffect(() => {
    const tick = () => {
      setClock(clockLabel());
      setDay(weekdayShort());
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (compact) {
    return (
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="font-mono tabular">
          {day} · {clock} IST
        </span>
        <span>{sim ? "SIMULATED" : "LIVE"}</span>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <span
        className={cn(
          "rounded-full px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-wider",
          sim ? "bg-elevated text-delay ring-1 ring-delay/40" : "bg-elevated text-live ring-1 ring-live/40",
        )}
      >
        {sim ? "Sim" : "Live"}
      </span>
      <span className="font-mono text-xs tabular text-muted">{day}</span>
      <span className="font-mono text-sm tabular text-live">{clock} IST</span>
    </div>
  );
});
