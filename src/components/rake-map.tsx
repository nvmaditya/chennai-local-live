import { carShortLabel, isLadiesCar, rakeOf } from "@/data/rakes";
import type { CarClass, LeadingCab } from "@/lib/transit/types";
import { cn } from "@/lib/utils";

export function heatClass(v: number): string {
  if (v < 0.22) return "bg-heat-0 text-muted";
  if (v < 0.4) return "bg-heat-1 text-fg";
  if (v < 0.58) return "bg-heat-2 text-bg";
  if (v < 0.75) return "bg-heat-3 text-fg";
  return "bg-heat-4 text-fg";
}

function iconFor(cls: CarClass): string {
  if (isLadiesCar(cls)) return "L";
  if (cls === "FC" || cls === "FC_LADIES_COMPOSITE") return "1";
  if (cls.startsWith("AC")) return "A";
  return "G";
}

export function MiniHeat({ occupancy }: { occupancy: number[] }) {
  return (
    <div className="flex h-3 w-24 gap-px" title="Likely load by car, front to rear of travel">
      {occupancy.map((v, i) => (
        <div
          key={i}
          className={cn("min-w-0 flex-1 rounded-sm", heatClass(v).split(" ")[0])}
        />
      ))}
    </div>
  );
}

export function RakeMap({
  rakeId,
  occupancy,
  leadingCab,
  compact,
  highlight,
}: {
  rakeId: string;
  occupancy?: number[];
  leadingCab: LeadingCab;
  compact?: boolean;
  highlight?: number[];
}) {
  const rake = rakeOf(rakeId);
  const cars = leadingCab === "carN" ? [...rake.cars].reverse() : rake.cars;
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs uppercase tracking-wider text-muted">
        <span>{leadingCab === "car1" ? "Front · cab 1" : "Front · cab N"}</span>
        <span className="font-mono tabular">
          {rake.carCount}-car · {Math.round(rake.rakeLengthMeters)} m
        </span>
        <span>Rear</span>
      </div>
      <div
        className="flex gap-0.5 overflow-x-auto pb-1"
        role="list"
        aria-label={`${rake.carCount}-car rake, front is ${leadingCab === "car1" ? "car 1" : "car " + rake.carCount}`}
      >
        {cars.map((car, i) => {
          const occ = occupancy?.[car.index - 1];
          const hot = highlight?.includes(car.index);
          const ladies = isLadiesCar(car.class);
          return (
            <div
              key={car.index}
              role="listitem"
              title={`Car ${car.index} ${car.type} ${carShortLabel(car.class)}${occ != null ? ` · likely load ${Math.round(occ * 100)}%` : ""}`}
              className={cn(
                "relative flex shrink-0 flex-col items-center justify-between rounded-sm border px-0.5 py-1 text-center",
                compact ? "h-14 w-6" : "h-20 w-9 sm:w-10",
                occ == null ? "border-border bg-elevated text-fg" : heatClass(occ),
                ladies && "ring-1 ring-ladies",
                hot && "outline outline-offset-1 outline-live",
                i === 0 && "rounded-l-md",
                i === cars.length - 1 && "rounded-r-md",
              )}
            >
              <span className="font-mono text-xs tabular leading-none">{car.index}</span>
              <span className="text-xs font-semibold leading-none" aria-hidden>
                {iconFor(car.class)}
              </span>
              {!compact ? (
                <span className="text-xs leading-none">{carShortLabel(car.class)}</span>
              ) : null}
              {occ != null && !compact ? (
                <span className="font-mono text-xs tabular leading-none">{Math.round(occ * 100)}</span>
              ) : null}
            </div>
          );
        })}
      </div>
      {!compact ? (
        <p className="mt-1.5 text-xs text-muted">
          L = ladies, 1 = first class / composite, A = AC, G = general. Colour is a likely-load hint, not CCTV.
        </p>
      ) : null}
    </div>
  );
}

export function CrowdBars({
  occupancy,
  front,
  mid,
  rear,
}: {
  occupancy: number[];
  front: number;
  mid: number;
  rear: number;
}) {
  const zones = [
    { k: "Front", v: front },
    { k: "Mid", v: mid },
    { k: "Rear", v: rear },
  ];
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1">
        {occupancy.map((v, i) => (
          <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="flex h-16 w-full items-end rounded-sm bg-elevated">
              <div
                className={cn("w-full rounded-sm", heatClass(v).split(" ")[0])}
                style={{ height: `${Math.max(8, v * 100)}%` }}
                title={`Car ${i + 1}: ${Math.round(v * 100)}% likely load`}
              />
            </div>
            <span className="font-mono text-xs tabular text-subtle">{i + 1}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {zones.map((z) => (
          <div key={z.k} className="rounded-md border border-border bg-surface px-2 py-1.5">
            <div className="text-xs uppercase tracking-wider text-muted">{z.k}</div>
            <div className="font-mono text-sm tabular">{Math.round(z.v * 100)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
