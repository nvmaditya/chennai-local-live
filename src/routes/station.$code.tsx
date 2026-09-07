import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PlatformDiagram } from "@/components/platform-diagram";
import { CrowdBars, MiniHeat, RakeMap } from "@/components/rake-map";
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

  return (
    <AppShell source={snap?.source}>
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
          <ArrowLeft className="size-4" /> Network
        </Link>
        <p className="mt-3 text-xs uppercase tracking-wider text-muted">
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

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section className="order-2 lg:order-1">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Platforms</h2>
            <PlatformDiagram code={st.code} train={board[0]} highlightCars={crowd.ladiesCars} />
          </section>
          <section className="order-1 lg:order-2">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Where to stand</h2>
            <div className="mb-3 grid grid-cols-2 gap-2">
              {(["DOWN", "UP"] as Direction[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDir(d)}
                  className={cn(
                    "rounded-md px-3 py-2 text-left text-sm ring-1 ring-border",
                    dir === d ? "bg-fg text-bg" : "text-muted",
                  )}
                >
                  <span className="block font-medium">{d === "DOWN" ? "Down" : "Up"}</span>
                  <span className={cn("block text-xs", dir === d ? "text-bg/70" : "text-subtle")}>
                    {d === "DOWN" ? LINE_BY_ID[lineId].downLabel.replace("Towards ", "") : LINE_BY_ID[lineId].upLabel.replace("Towards ", "")}
                  </span>
                </button>
              ))}
            </div>
            <label className="mb-3 block text-xs text-muted">
              Came from
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
            <p className="mt-2 text-xs text-muted">{standHint(prev, st.code, lineId, dir, rakeId)}</p>
          </section>
        </div>

        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Next trains</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-elevated text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Train</th>
                  <th className="px-3 py-2 font-medium">To</th>
                  <th className="px-3 py-2 font-medium">PF</th>
                  <th className="px-3 py-2 font-medium">ETA</th>
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
                    rakeTemplateId: rk.id,
                    leadingCab: t.leadingCab,
                  });
                  return (
                    <tr key={t.trainNumber} className="border-t border-border">
                      <td className="px-3 py-2.5 font-mono tabular">
                        <Link to="/train/$number" params={{ number: t.trainNumber }} className="hover:underline">
                          {t.trainNumber}
                        </Link>
                        {t.isAC ? <span className="ml-2 text-xs text-ac">AC</span> : null}
                      </td>
                      <td className="px-3 py-2.5">{dest?.name ?? t.destination}</td>
                      <td className="px-3 py-2.5 font-mono">
                        {t.platformNext}
                        {t.platformChanged ? <span className="ml-1 text-delay">changed</span> : null}
                      </td>
                      <td className="px-3 py-2.5 font-mono tabular">{t.eta ?? "—"}</td>
                      <td className="px-3 py-2.5">
                        <MiniHeat occupancy={t.direction === "UP" ? [...c.occupancy].reverse() : c.occupancy} />
                      </td>
                    </tr>
                  );
                })}
                {!board.length ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-muted">
                      {snap ? "No trains due in this window." : "Loading board…"}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {g?.confidence === "inferred" ? (
            <p className="mt-3 text-xs text-delay">Inferred 2-platform layout. Treat PF numbers as a hint.</p>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}
