import { rakeOf } from "@/data/rakes";
import { geometryFor } from "@/lib/transit/geometry";
import type { LeadingCab, LiveTrain, StationGeometry } from "@/lib/transit/types";
import { cn } from "@/lib/utils";

export function PlatformDiagram({
  code,
  train,
  highlightCars,
}: {
  code: string;
  train?: LiveTrain | null;
  highlightCars?: number[];
}) {
  const g = geometryFor(code);
  if (!g) return <p className="text-sm text-muted">No geometry for {code}.</p>;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <ConfidenceChip confidence={g.confidence} />
        <span className="text-xs uppercase tracking-wider text-muted">{g.layout}</span>
      </div>
      <div className="space-y-3">
        {g.platforms.map((p) => (
          <PlatformRow
            key={p.id}
            g={g}
            platformId={p.id}
            train={train}
            highlightCars={highlightCars}
          />
        ))}
      </div>
      <ul className="space-y-1.5 text-sm">
        {g.accesses.map((a) => (
          <li key={a.id} className="rounded-md border border-border bg-surface px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase text-delay">{a.kind}</span>
              <span className="font-medium">{a.name}</span>
              {a.isPrimaryPeakEntry ? (
                <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] uppercase tracking-wider text-live">
                  Peak entry
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-muted">{a.notes}</p>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">{g.peakNotes}</p>
    </div>
  );
}

function ConfidenceChip({ confidence }: { confidence: StationGeometry["confidence"] }) {
  const label =
    confidence === "high" ? "Authored layout" : confidence === "medium" ? "Authored · medium" : "Inferred layout";
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        confidence === "inferred" ? "bg-elevated text-delay ring-1 ring-delay/40" : "bg-elevated text-live ring-1 ring-live/30",
      )}
    >
      {label}
    </span>
  );
}

function PlatformRow({
  g,
  platformId,
  train,
  highlightCars,
}: {
  g: StationGeometry;
  platformId: string;
  train?: LiveTrain | null;
  highlightCars?: number[];
}) {
  const p = g.platforms.find((x) => x.id === platformId)!;
  const rake = train ? rakeOf(train.rakeTemplateId) : null;
  const leading: LeadingCab = train?.leadingCab ?? "car1";
  const cars = rake
    ? leading === "carN"
      ? [...rake.cars].reverse()
      : rake.cars
    : [];
  const dumps = g.accesses.flatMap((a) =>
    a.dumpZone.filter((z) => z.platformId === platformId).map((z) => ({ ...z, name: a.name, primary: a.isPrimaryPeakEntry })),
  );

  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold">
          PF {p.number} · {p.type} · {p.defaultDirection}
        </span>
        <span className="text-muted">
          Doors {p.doorsOpen} · {p.lengthM} m · zero {p.zeroEnd}
        </span>
      </div>
      <div className="relative h-16 overflow-hidden rounded-md bg-bg ring-1 ring-border">
        {dumps.map((d) => (
          <div
            key={d.name + d.from}
            className={cn(
              "absolute top-0 h-full",
              d.primary ? "bg-live/15" : "bg-fg/5",
            )}
            style={{ left: `${d.from * 100}%`, width: `${Math.max(4, (d.to - d.from) * 100)}%` }}
            title={`${d.name} dump zone`}
          />
        ))}
        <div className="absolute inset-x-2 bottom-1 top-6 flex gap-0.5">
          {cars.length ? (
            cars.map((c) => (
              <div
                key={c.index}
                className={cn(
                  "flex flex-1 items-center justify-center rounded-sm font-mono text-[10px]",
                  highlightCars?.includes(c.index) ? "bg-live text-bg" : "bg-elevated text-muted",
                )}
              >
                {c.index}
              </div>
            ))
          ) : (
            <div className="flex flex-1 items-center justify-center text-[11px] text-subtle">
              Next rake overlays here when a train is selected
            </div>
          )}
        </div>
        <div className="absolute left-2 top-1 text-[9px] uppercase tracking-wider text-subtle">
          {p.zeroEnd}
        </div>
      </div>
    </div>
  );
}

export default PlatformDiagram;
