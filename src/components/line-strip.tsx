import { Link } from "@tanstack/react-router";
import { LINE_BY_ID } from "@/data/lines";
import { stationsOn, stationOf } from "@/lib/transit/catalog";
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
  return (
    <div className="space-y-6">
      <div className="relative overflow-x-auto pb-8 pt-10">
        <div className="relative min-w-[720px] px-6">
          <div className="absolute left-6 right-6 top-[52px] h-1 rounded-full" style={{ background: line.colour }} />
          <div className="relative flex justify-between">
            {sts.map((s) => {
              const here = trains.filter(
                (t) => t.lineId === lineId && (t.lastReportedStation === s.code || t.nextStation === s.code),
              );
              return (
                <div key={s.code} className="relative flex w-6 flex-col items-center">
                  {here.slice(0, 3).map((t, i) => (
                    <Link
                      key={t.trainNumber}
                      to="/train/$number"
                      params={{ number: t.trainNumber }}
                      className="absolute font-mono text-[9px] tabular text-bg"
                      style={{
                        top: -18 - i * 14,
                        background: line.colour,
                        padding: "1px 4px",
                        borderRadius: 4,
                      }}
                      title={`${t.trainNumber} ${t.destination}`}
                    >
                      {t.trainNumber}
                    </Link>
                  ))}
                  <Link
                    to="/station/$code"
                    params={{ code: s.code }}
                    className="relative z-10 grid h-4 w-4 place-items-center rounded-full bg-bg ring-2"
                    style={{ ["--tw-ring-color" as string]: line.colour }}
                    title={s.name}
                  />
                  <span
                    className={cn(
                      "mt-2 origin-top-left translate-x-2 -rotate-45 whitespace-nowrap text-[10px]",
                      s.terminal || s.interchange ? "text-fg" : "text-muted",
                    )}
                  >
                    {s.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted">
        {line.upLabel} (UP) · {line.downLabel} (DOWN) · km 0–{maxKm.toFixed(0)} from {stationOf(line.origin)?.name}
      </p>
    </div>
  );
}
