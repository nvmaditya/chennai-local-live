import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { TrainList } from "@/components/train-list";
import { LINES } from "@/data/lines";
import { searchStations } from "@/lib/transit/catalog";
import { useLiveNetwork } from "@/lib/transit/use-live";
import type { LineId, LiveTrain } from "@/lib/transit/types";
import { cn } from "@/lib/utils";

const NetworkMap = lazy(() => import("@/components/network-map"));
const TrainPanel = lazy(() => import("@/components/train-panel"));

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { snap } = useLiveNetwork();
  const nav = useNavigate();
  const [active, setActive] = useState<LineId[]>(["south", "west", "north", "mrts"]);
  const [selected, setSelected] = useState<LiveTrain | null>(null);
  const [q, setQ] = useState("");
  const [searchReady, setSearchReady] = useState(false);
  useEffect(() => setSearchReady(true), []);
  const hits = useMemo(() => searchStations(q, 8), [q]);

  const trains = useMemo(
    () => (snap?.trains ?? []).filter((t) => active.includes(t.lineId)),
    [snap?.trains, active],
  );
  const selectedLive = trains.find((t) => t.trainNumber === selected?.trainNumber) ?? selected;

  const toggle = useCallback((id: LineId) => {
    setActive((cur) => {
      if (cur.includes(id) && cur.length > 1) return cur.filter((x) => x !== id);
      if (!cur.includes(id)) return [...cur, id];
      return cur;
    });
  }, []);

  const onSelectTrain = useCallback((t: LiveTrain) => setSelected(t), []);
  const onSelectStation = useCallback(
    (code: string) => nav({ to: "/station/$code", params: { code } }),
    [nav],
  );

  return (
    <AppShell source={snap?.source}>
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1440px] flex-1 flex-col overflow-hidden md:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex flex-col gap-2 border-b border-border px-3 py-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              {searchReady ? (
                <>
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
                  <label className="sr-only" htmlFor="stn-search">
                    Search stations
                  </label>
                  <input
                    id="stn-search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Station or code — Tambaram, TBM"
                    autoComplete="off"
                    className="h-11 w-full rounded-md border border-border bg-surface pl-10 pr-3 text-sm text-fg outline-none placeholder:text-subtle"
                  />
                  {q && hits.length ? (
                    <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-surface shadow-panel">
                      {hits.map((s) => (
                        <li key={s.code}>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between px-3 py-3 text-left text-sm hover:bg-elevated"
                            onClick={() => {
                              setQ("");
                              nav({ to: "/station/$code", params: { code: s.code } });
                            }}
                          >
                            <span>
                              {s.name} <span className="text-muted">{s.nameTa}</span>
                            </span>
                            <span className="font-mono text-xs text-muted">{s.code}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </>
              ) : (
                <div className="h-11 rounded-md border border-border bg-surface" />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {LINES.map((l) => {
                const on = active.includes(l.id);
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => toggle(l.id)}
                    className={cn(
                      "rounded-full px-3 py-2 text-xs font-medium ring-1 transition-colors duration-150",
                      on ? "text-bg" : "bg-transparent text-muted",
                    )}
                    style={
                      on
                        ? { background: l.colour, ["--tw-ring-color" as string]: l.colour }
                        : { ["--tw-ring-color" as string]: l.colour }
                    }
                  >
                    {l.name.replace(" Line", "")}
                  </button>
                );
              })}
              <span className="ml-1 font-mono text-xs tabular text-muted">
                {snap ? `${trains.length} trains` : "Loading"}
              </span>
            </div>
          </div>
          <div className="relative min-h-80 flex-1 bg-panel md:min-h-0">
            <Suspense fallback={<div className="absolute inset-0 bg-panel" />}>
              <NetworkMap
                trains={trains}
                activeLines={active}
                selected={selectedLive?.trainNumber}
                onSelectTrain={onSelectTrain}
                onSelectStation={onSelectStation}
              />
            </Suspense>
            {selectedLive ? (
              <div className="absolute inset-x-0 bottom-0 z-20 max-h-[min(72dvh,560px)] overflow-hidden rounded-t-xl border-t border-border bg-surface shadow-panel md:inset-x-auto md:bottom-4 md:left-4 md:w-[380px] md:rounded-xl md:border">
                <Suspense fallback={<div className="h-40 bg-surface" />}>
                  <TrainPanel train={selectedLive} onClose={() => setSelected(null)} />
                </Suspense>
              </div>
            ) : (
              <p className="pointer-events-none absolute left-3 top-3 hidden rounded-md bg-bg/70 px-2 py-1 text-xs text-muted md:block">
                Drag to pan · scroll to zoom · tap a train or station
              </p>
            )}
          </div>
        </div>
        <aside className="flex h-[40dvh] w-full shrink-0 flex-col border-t border-border bg-surface md:h-auto md:max-h-none md:w-[360px] md:border-l md:border-t-0">
          <div className="border-b border-border px-4 py-2.5 text-xs uppercase tracking-wider text-muted">
            Running now
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {snap ? (
              <TrainList trains={trains} onSelect={onSelectTrain} selected={selectedLive?.trainNumber} />
            ) : (
              <p className="px-4 py-8 text-sm text-muted">Building the board…</p>
            )}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
