import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { memo } from "react";
import { rakeOf } from "@/data/rakes";
import { stationOf } from "@/data/stations";
import { crowdForTrain } from "@/lib/transit/crowd";
import { defaultPlatform } from "@/lib/transit/geometry";
import { LINE_COLOUR, prevStations } from "@/lib/transit/catalog";
import type { LiveTrain } from "@/lib/transit/types";
import { CrowdBars, RakeMap } from "./rake-map";

export const TrainPanel = memo(function TrainPanel({ train, onClose }: { train: LiveTrain; onClose: () => void }) {
  const dest = stationOf(train.destination);
  const origin = stationOf(train.origin);
  const next = train.nextStation ? stationOf(train.nextStation) : undefined;
  const last = stationOf(train.lastReportedStation);
  const arriving = train.nextStation ?? train.lastReportedStation;
  const prev = prevStations(arriving, train.lineId, train.direction, 3).map((s) => s.code);
  const crowd = crowdForTrain(train, arriving, prev);
  const rake = rakeOf(train.rakeTemplateId);
  const pf = train.platformNext || defaultPlatform(arriving, train.direction);

  return (
    <aside className="flex h-full max-h-[min(72dvh,560px)] flex-col bg-surface">
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: LINE_COLOUR[train.lineId] }} />
            <h2 className="font-mono text-lg tabular">{train.trainNumber}</h2>
            <span className="rounded-full bg-elevated px-2 py-0.5 text-xs uppercase tracking-wider text-muted">
              {train.dataSource === "SCHEDULE_SIM" ? "Sim" : train.dataSource}
            </span>
          </div>
          <p className="truncate text-sm text-muted">
            {origin?.name} → {dest?.name}
            {train.via ? ` via ${train.via}` : ""}
          </p>
        </div>
        <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-sm" aria-label="Close train">
          <X className="size-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Stat label="Last" value={`${last?.name ?? train.lastReportedStation}`} />
          <Stat label="Next" value={next ? `${next.name} · PF ${pf}` : "Terminus"} />
          <Stat label="Delay" value={train.delayMinutes ? `+${train.delayMinutes} min` : "On time"} />
          <Stat label="ETA" value={train.eta ?? "—"} />
        </div>
        <p className="text-xs text-muted">Platform is a geometry default unless a live board overwrites it.</p>
        <RakeMap rakeId={train.rakeTemplateId} occupancy={crowd.occupancy} leadingCab={train.leadingCab} />
        <CrowdBars occupancy={crowd.occupancy} front={crowd.front} mid={crowd.mid} rear={crowd.rear} />
        <p className="text-sm leading-relaxed">{crowd.sentence}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            to="/train/$number"
            params={{ number: train.trainNumber }}
            className="rounded-sm bg-fg px-3 py-2 text-sm font-medium text-bg"
          >
            Full run
          </Link>
          {next ? (
            <Link
              to="/station/$code"
              params={{ code: next.code }}
              className="rounded-sm border border-border px-3 py-2 text-sm"
            >
              {next.name}
            </Link>
          ) : null}
          <Link
            to="/line/$id"
            params={{ id: train.lineId }}
            className="rounded-sm border border-border px-3 py-2 text-sm"
          >
            {rake.carCount}-car {train.lineId}
          </Link>
        </div>
      </div>
    </aside>
  );
});

export default TrainPanel;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-bg px-3 py-2">
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className="truncate text-sm">{value}</div>
    </div>
  );
}
