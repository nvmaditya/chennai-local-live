import { Link } from "@tanstack/react-router";
import { LINE_BY_ID } from "@/data/lines";
import { MAJOR, stationOf, stationsOn } from "@/lib/transit/catalog";
import type { LineId, LiveTrain } from "@/lib/transit/types";
import { cn } from "@/lib/utils";

export function LineStrip({
  lineId,
  trains,
}: {
  lineId: LineId;
  trains: LiveTrain[];
}) {
  const line = LINE_BY_ID[lineId];
  const sts = stationsOn(lineId);
  const maxKm = Math.max(...sts.map((s) => s.km[lineId] ?? 0), 1);
  const w = Math.max(sts.length * 36, 640);
  return (
    <div className="mt-6 space-y-3">
      <div className="overflow-x-auto pb-2">
        <div className="relative px-4 pt-8" style={{ minWidth: w }}>
          <div className="absolute left-4 right-4 top-10 h-1 rounded-full" style={{ background: line.colour }} />
          <div className="relative flex justify-between">
            {sts.map((s) => {
              const here = trains.filter(
                (t) => t.lineId === lineId && (t.lastReportedStation === s.code || t.nextStation === s.code),
              );
              const label = MAJOR.has(s.code) || s.terminal;
              return (
                <div key={s.code} className="relative flex w-7 flex-col items-center">
                  {here.slice(0, 2).map((t, i) => (
                    <Link
                      key={t.trainNumber}
                      to="/train/$number"
                      params={{ number: t.trainNumber }}
                      className="absolute rounded-sm px-1 font-mono text-xs tabular text-bg"
                      style={{ top: -22 - i * 16, background: line.colour }}
                      title={`${t.trainNumber} ${stationOf(t.destination)?.name ?? t.destination}`}
                    >
                      {t.trainNumber}
                    </Link>
                  ))}
                  <Link
                    to="/station/$code"
                    params={{ code: s.code }}
                    className="relative z-10 block h-3.5 w-3.5 rounded-full bg-bg ring-2"
                    style={{ ["--tw-ring-color" as string]: line.colour }}
                    title={s.name}
                    aria-label={s.name}
                  />
                  {label ? (
                    <span
                      className={cn(
                        "mt-2 max-w-20 text-center text-xs leading-tight",
                        s.terminal ? "font-medium text-fg" : "text-muted",
                      )}
                    >
                      {s.name}
                    </span>
                  ) : (
                    <span className="sr-only">{s.name}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted">
        {line.upLabel} (UP) · {line.downLabel} (DOWN) · {maxKm.toFixed(0)} km · swipe the strip
      </p>
    </div>
  );
}
