import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PlatformDiagram } from "@/components/platform-diagram";
import { CrowdBars, RakeMap } from "@/components/rake-map";
import { LINE_BY_ID } from "@/data/lines";
import { rakeOf } from "@/data/rakes";
import { LINE_COLOUR, prevStations, stationOf } from "@/lib/transit/catalog";
import { crowdAtStation, leadingFor, standHint } from "@/lib/transit/crowd";
import { geometryFor } from "@/lib/transit/geometry";
import { stationBoard } from "@/lib/transit/simulator";
import { useLiveNetwork } from "@/lib/transit/use-live";
import type { Direction } from "@/lib/transit/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/station/$code")({ component: StationPage });

function StationPage() {
  const { code } = Route.useParams();
  const st = stationOf(code.toUpperCase());
  if (!st) throw notFound();
  const { snap } = useLiveNetwork();
  const board = snap ? stationBoard(st.code, snap.generatedAt, 12) : [];
  const g = geometryFor(st.code);
  const lineId = st.lines[0];
  const line = LINE_BY_ID[lineId];
  const suburb = line.termini[line.termini.length - 1];
  const [dir, setDir] = useState<Direction>("DOWN");
  const neighbours = prevStations(st.code, lineId, dir, 4);
  const [prev, setPrev] = useState(neighbours[0]?.code ?? st.code);
  useEffect(() => {
    const n = prevStations(st.code, lineId, dir, 4);
    if (n[0]) setPrev(n[0].code);
  }, [dir, lineId, st.code]);
  const rakeId = lineId === "mrts" ? "emu-9" : "emu-12";
  const crowd = useMemo(
    () =>
      crowdAtStation({
        lineId,
        direction: dir,
        origin: dir === "DOWN" ? line.origin : suburb,
        destination: dir === "DOWN" ? suburb : line.origin,
        arrivingAt: st.code,
        rakeTemplateId: rakeId,
        leadingCab: leadingFor(dir),
        previous: [prev],
        nowMs: snap?.generatedAt,
      }),
    [dir, line.origin, lineId, prev, rakeId, snap?.generatedAt, st.code, suburb],
  );
  const nextTrain = board[0];

  return (
    <AppShell source={snap?.source}>
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <p className="text-xs uppercase tracking-wider text-muted">
          {st.lines.map((l) => LINE_BY_ID[l].name).join(" · ")}
          {st.metroInterchange ? " · Metro interchange" : ""}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{st.name}</h1>
        <p className="text-muted">
          {st.nameTa} · {st.code}
          {st.aliases?.length ? ` · also ${st.aliases.join(", ")}` : ""}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {st.lines.map((l) => (
            <Link
              key={l}
              to="/line/$id"
              params={{ id: l }}
              className="rounded-full px-3 py-1 text-xs text-bg"
              style={{ background: LINE_COLOUR[l] }}
            >
              {LINE_BY_ID[l].name}
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Platform geometry</h2>
            <PlatformDiagram code={st.code} train={nextTrain} highlightCars={crowd.ladiesCars} />
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Crowd from last station</h2>
            <div className="mb-3 flex flex-wrap gap-2">
              {(["DOWN", "UP"] as Direction[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDir(d)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs ring-1 ring-border",
                    dir === d ? "bg-fg text-bg" : "text-muted",
                  )}
                >
                  {d} · {d === "DOWN" ? LINE_BY_ID[lineId].downLabel : LINE_BY_ID[lineId].upLabel}
                </button>
              ))}
            </div>
            <label className="mb-3 block text-xs text-muted">
              Previous station
              <select
                className="mt-1 h-11 w-full rounded-md border border-border bg-bg px-3 text-sm text-fg"
                value={prev}
                onChange={(e) => setPrev(e.target.value)}
              >
                {neighbours.map((n) => (
                  <option key={n.code} value={n.code}>
                    {n.name} ({n.code})
                  </option>
                ))}
              </select>
            </label>
            <RakeMap rakeId={rakeId} occupancy={crowd.occupancy} leadingCab={leadingFor(dir)} />
            <div className="mt-3">
              <CrowdBars occupancy={crowd.occupancy} front={crowd.front} mid={crowd.mid} rear={crowd.rear} />
            </div>
            <p className="mt-3 text-sm leading-relaxed">{crowd.sentence}</p>
            <p className="mt-2 text-xs text-muted">
              {standHint(prev, st.code, lineId, dir, rakeId)}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-subtle">Likely load · not live CCTV</p>
          </section>
        </div>

        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Next 12 trains</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-elevated text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Train</th>
                  <th className="px-3 py-2 font-medium">To</th>
                  <th className="px-3 py-2 font-medium">PF</th>
                  <th className="px-3 py-2 font-medium">ETA</th>
                  <th className="px-3 py-2 font-medium">Rake</th>
                  <th className="px-3 py-2 font-medium">Load</th>
                </tr>
              </thead>
              <tbody>
                {board.map((t) => {
                  const dest = stationOf(t.destination);
                  const rk = rakeOf(t.rakeTemplateId);
                  const c = crowdAtStation({
                    lineId: t.lineId,
                    direction: t.direction,
                    origin: t.origin,
                    destination: t.destination,
                    arrivingAt: st.code,
                    rakeTemplateId: t.rakeTemplateId,
                    leadingCab: t.leadingCab,
                  });
                  const hot = Math.max(c.front, c.mid, c.rear);
                  return (
                    <tr key={t.trainNumber} className="border-t border-border">
                      <td className="px-3 py-2 font-mono tabular">
                        <Link to="/train/$number" params={{ number: t.trainNumber }} className="hover:underline">
                          {t.trainNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-2">{dest?.name ?? t.destination}</td>
                      <td className="px-3 py-2 font-mono">
                        {t.platformNext}
                        {t.platformChanged ? <span className="ml-1 text-delay">changed</span> : null}
                      </td>
                      <td className="px-3 py-2 font-mono tabular">{t.eta ?? "—"}</td>
                      <td className="px-3 py-2">
                        <RakeMap rakeId={rk.id} leadingCab={t.leadingCab} compact />
                      </td>
                      <td className="px-3 py-2 font-mono tabular text-xs">{Math.round(hot * 100)}%</td>
                    </tr>
                  );
                })}
                {!board.length ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-muted">
                      No trains due in the current window.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {g?.confidence === "inferred" ? (
            <p className="mt-3 text-xs text-delay">This station uses an inferred 2-platform default. Treat PF numbers as a hint.</p>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}
