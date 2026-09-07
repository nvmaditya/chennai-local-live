import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CrowdBars, RakeMap } from "@/components/rake-map";
import { LINE_COLOUR, pathCodes, prevStations, stationOf } from "@/lib/transit/catalog";
import { crowdForTrain } from "@/lib/transit/crowd";
import { defaultPlatform } from "@/lib/transit/geometry";
import { geometryFor } from "@/lib/transit/geometry";
import { simulateTrain, trainTimeline } from "@/lib/transit/simulator";
import { useLiveNetwork } from "@/lib/transit/use-live";
import type { LiveTrain } from "@/lib/transit/types";

export const Route = createFileRoute("/train/$number")({ component: TrainPage });

function TrainPage() {
  const { number } = Route.useParams();
  const { snap } = useLiveNetwork();
  const [train, setTrain] = useState<LiveTrain | null>(
    () => snap?.trains.find((t) => t.trainNumber === number) ?? null,
  );

  useEffect(() => {
    const fromSnap = snap?.trains.find((t) => t.trainNumber === number);
    if (fromSnap) {
      setTrain(fromSnap);
      return;
    }
    void fetch(`/api/live/train/${number}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.trainNumber) setTrain(j as LiveTrain);
      })
      .catch(() => {
        setTrain(simulateTrain(number) ?? null);
      });
  }, [number, snap]);

  if (!train) {
    return (
      <AppShell source={snap?.source}>
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">{snap ? `Train ${number} is not running` : "Loading run"}</h1>
          <p className="mt-2 text-sm text-muted">
            {snap
              ? "It may be outside today's window, or the number is not in the suburban series. Try a 400xx Beach–Tambaram or 410xx MRTS set."
              : "Fetching the simulated / live position…"}
          </p>
          <Link to="/" className="mt-6 inline-block rounded-sm bg-fg px-4 py-2 text-sm text-bg">
            Back to network
          </Link>
        </div>
      </AppShell>
    );
  }

  const dest = stationOf(train.destination);
  const origin = stationOf(train.origin);
  const codes = pathCodes(train.origin, train.destination, train.lineId);
  const iHere = Math.max(0, codes.indexOf(train.lastReportedStation));
  const nextFive = codes.slice(iHere + 1, iHere + 6);
  const timeline = trainTimeline(train);

  return (
    <AppShell source={train.dataSource}>
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
          <ArrowLeft className="size-4" /> Network
        </Link>
        <div className="mt-3 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: LINE_COLOUR[train.lineId] }} />
          <p className="text-xs uppercase tracking-wider text-muted">
            {train.lineId} · {train.dataSource === "SCHEDULE_SIM" ? "simulated" : train.dataSource} · {train.carCount}-car
            {train.isAC ? " · AC" : ""}
          </p>
        </div>
        <h1 className="mt-1 font-mono text-3xl tabular">{train.trainNumber}</h1>
        <p className="text-lg">
          {origin?.name} → {dest?.name}
        </p>
        <p className="text-sm text-muted">{train.name}{train.via ? ` via ${train.via}` : ""}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <Fact label="Last" value={`${stationOf(train.lastReportedStation)?.name ?? train.lastReportedStation} · PF ${train.platformLast}`} />
          <Fact
            label="Next"
            value={
              train.nextStation
                ? `${stationOf(train.nextStation)?.name} · PF ${train.platformNext}${train.platformChanged ? " (changed)" : ""}`
                : "Terminus"
            }
          />
          <Fact label="Delay" value={train.delayMinutes ? `+${train.delayMinutes} min` : "On time"} />
          <Fact label="Leading cab" value={train.leadingCab === "car1" ? "Car 1 (origin end)" : "Car N (after reverse)"} />
        </div>
        {train.nextStation ? (
          <p className="mt-3 text-sm text-muted">
            Alight {geometryFor(train.nextStation)?.platforms.find((p) => p.number === train.platformNext)?.doorsOpen ?? "left"} at{" "}
            {stationOf(train.nextStation)?.name}. Platform is an estimate.
          </p>
        ) : null}

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Rake map</h2>
          <RakeMap
            rakeId={train.rakeTemplateId}
            occupancy={crowdForTrain(train, train.nextStation ?? train.lastReportedStation).occupancy}
            leadingCab={train.leadingCab}
          />
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Crowd forecast · next stops</h2>
          <div className="space-y-5">
            {(nextFive.length ? nextFive : [train.lastReportedStation]).map((code) => {
              const prev = prevStations(code, train.lineId, train.direction, 3).map((s) => s.code);
              const c = crowdForTrain(train, code, prev);
              const st = stationOf(code);
              return (
                <div key={code} className="rounded-lg border border-border bg-surface p-4">
                  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                    <Link to="/station/$code" params={{ code }} className="font-medium hover:underline">
                      {st?.name} <span className="font-mono text-xs text-muted">{code}</span>
                    </Link>
                    <span className="text-xs text-muted">PF {defaultPlatform(code, train.direction)} · likely load</span>
                  </div>
                  <CrowdBars occupancy={c.occupancy} front={c.front} mid={c.mid} rear={c.rear} />
                  <p className="mt-2 text-sm text-muted">{c.sentence}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Run</h2>
          <ol className="space-y-0">
            {timeline.map((s) => (
              <li key={s.code} className="flex items-center gap-3 border-b border-border py-2 text-sm">
                <span className={s.current ? "h-2 w-2 rounded-full bg-live" : "h-2 w-2 rounded-full bg-border-strong"} />
                <Link to="/station/$code" params={{ code: s.code }} className="flex-1 hover:underline">
                  {s.name}
                </Link>
                <span className="font-mono text-xs text-muted">PF {s.pf}</span>
                <span className="w-14 text-right font-mono text-xs tabular text-muted">{s.eta ?? ""}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </AppShell>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}
