import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { NetworkMap, TrainList } from "@/components/network-map";
import { TrainPanel } from "@/components/train-panel";
import { LINES } from "@/data/lines";
import { searchStations } from "@/lib/transit/catalog";
import { useLiveNetwork } from "@/lib/transit/use-live";
import type { LineId, LiveTrain } from "@/lib/transit/types";
import { cn } from "@/lib/utils";

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

  const trains = (snap?.trains ?? []).filter((t) => active.includes(t.lineId));
  const selectedLive = trains.find((t) => t.trainNumber === selected?.trainNumber) ?? selected;

  function toggle(id: LineId) {
    setActive((cur) => {
      if (cur.includes(id) && cur.length > 1) return cur.filter((x) => x !== id);
      if (!cur.includes(id)) return [...cur, id];
      return cur;
    });
  }

  return (
    <AppShell source={snap?.source}>
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col md:flex-row">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
            {LINES.map((l) => {
              const on = active.includes(l.id);
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => toggle(l.id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors duration-150",
                    on ? "text-bg" : "bg-transparent text-muted",
                  )}
                  style={on ? { background: l.colour, ["--tw-ring-color" as string]: l.colour } : { ["--tw-ring-color" as string]: l.colour }}
                >
                  {l.name}
                </button>
              );
            })}
            <span className="ml-auto font-mono text-xs tabular text-muted">
              {trains.length ? `${trains.length} trains` : "100 stations · 4 lines"}
            </span>
          </div>
          <div className="relative min-h-[52dvh] flex-1 bg-panel board-grid">
            <NetworkMap
              trains={trains}
              activeLines={active}
              selected={selectedLive?.trainNumber}
              onSelectTrain={(t) => setSelected(t)}
              onSelectStation={(code) => nav({ to: "/station/$code", params: { code } })}
            />
            <div className="absolute left-3 top-3 right-3 max-w-sm">
              {searchReady ? (
                <>
              <label className="sr-only" htmlFor="stn-search">
                Search stations
              </label>
              <input
                id="stn-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Station or code — Tambaram, TBM"
                autoComplete="off"
                className="h-11 w-full rounded-md border border-border bg-bg/90 px-3 text-sm text-fg outline-none placeholder:text-subtle"
              />
              {q && hits.length ? (
                <ul className="mt-1 overflow-hidden rounded-md border border-border bg-surface shadow-panel">
                  {hits.map((s) => (
                    <li key={s.code}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-elevated"
                        onClick={() => {
                          setQ("");
                          nav({ to: "/station/$code", params: { code: s.code } });
                        }}
                      >
                        <span>
                          {s.name}{" "}
                          <span className="text-muted">{s.nameTa}</span>
                        </span>
                        <span className="font-mono text-xs text-muted">{s.code}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
                </>
              ) : (
                <div className="h-11 rounded-md border border-border bg-bg/90" />
              )}
            </div>
          </div>
        </div>
        <div className="flex h-[42dvh] w-full shrink-0 flex-col md:h-auto md:w-[380px]">
          {selectedLive ? (
            <TrainPanel train={selectedLive} onClose={() => setSelected(null)} />
          ) : (
            <div className="flex h-full flex-col border-t border-border md:border-l md:border-t-0">
              <div className="border-b border-border px-4 py-3 text-xs uppercase tracking-wider text-muted">
                Running now
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <TrainList trains={trains} onSelect={setSelected} selected={selected?.trainNumber} />
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
