import { Link } from "@tanstack/react-router";
import { memo, useMemo, useState } from "react";
import { LINES } from "@/data/lines";
import { LINE_COLOUR, stationOf } from "@/lib/transit/catalog";
import type { LineId, LiveTrain } from "@/lib/transit/types";
import { cn } from "@/lib/utils";

function rankTrain(t: LiveTrain): number {
  if (t.lastEvent === "AT_PLATFORM" || t.lastEvent === "ARRIVED") return 0;
  if (t.lastEvent === "APPROACHING") return 1;
  return 2;
}

export const TrainList = memo(function TrainList({
  trains,
  onSelect,
  selected,
  grouped = true,
}: {
  trains: LiveTrain[];
  onSelect: (t: LiveTrain) => void;
  selected?: string | null;
  grouped?: boolean;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const groups = useMemo(() => {
    const m = new Map<LineId, LiveTrain[]>();
    for (const t of trains) {
      const arr = m.get(t.lineId) ?? [];
      arr.push(t);
      m.set(t.lineId, arr);
    }
    for (const arr of m.values()) {
      arr.sort(
        (a, b) =>
          rankTrain(a) - rankTrain(b) || (a.eta ?? "99").localeCompare(b.eta ?? "99") || a.trainNumber.localeCompare(b.trainNumber),
      );
    }
    return LINES.filter((l) => m.has(l.id)).map((l) => ({ line: l, trains: m.get(l.id)! }));
  }, [trains]);

  if (!trains.length) {
    return <p className="px-4 py-8 text-sm text-muted">No trains on the selected lines in this window.</p>;
  }

  if (!grouped) {
    return (
      <ul className="divide-y divide-border">
        {trains.map((t) => (
          <TrainRow key={t.trainNumber} t={t} selected={selected === t.trainNumber} onSelect={onSelect} />
        ))}
      </ul>
    );
  }

  return (
    <div>
      {groups.map(({ line, trains: list }) => {
        const expanded = open[line.id] ?? false;
        const shown = expanded ? list : list.slice(0, 5);
        return (
          <section
            key={line.id}
            className="[content-visibility:auto] [contain-intrinsic-size:auto_240px]"
          >
            <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-surface px-4 py-2">
              <span className="h-2 w-2 rounded-full" style={{ background: line.colour }} />
              <h3 className="text-xs font-semibold uppercase tracking-wider">{line.name}</h3>
              <span className="ml-auto font-mono text-xs tabular text-muted">{list.length}</span>
            </div>
            <ul className="divide-y divide-border">
              {shown.map((t) => (
                <TrainRow key={t.trainNumber} t={t} selected={selected === t.trainNumber} onSelect={onSelect} />
              ))}
            </ul>
            {list.length > 5 ? (
              <button
                type="button"
                className="w-full px-4 py-2 text-left text-xs text-muted hover:text-fg"
                onClick={() => setOpen((s) => ({ ...s, [line.id]: !expanded }))}
              >
                {expanded ? "Show fewer" : `${list.length - 5} more on ${line.name}`}
              </button>
            ) : null}
          </section>
        );
      })}
    </div>
  );
});

const TrainRow = memo(function TrainRow({
  t,
  selected,
  onSelect,
}: {
  t: LiveTrain;
  selected: boolean;
  onSelect: (t: LiveTrain) => void;
}) {
  const dest = stationOf(t.destination);
  const last = stationOf(t.lastReportedStation);
  const next = t.nextStation ? stationOf(t.nextStation) : undefined;
  return (
    <li className="flex items-stretch">
      <button
        type="button"
        onClick={() => onSelect(t)}
        className={cn(
          "flex min-w-0 flex-1 items-start gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-elevated",
          selected && "bg-elevated",
        )}
      >
        <span
          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: LINE_COLOUR[t.lineId] }}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="font-mono text-sm tabular">{t.trainNumber}</span>
            <span className="truncate text-sm">{dest?.name ?? t.destination}</span>
            {t.isAC ? <span className="text-xs uppercase tracking-wider text-ac">AC</span> : null}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted">
            {eventLabel(t.lastEvent)} {last?.name ?? t.lastReportedStation}
            {next ? ` → ${next.name}` : ""} · PF {t.platformNext}
            {t.delayMinutes ? ` · +${t.delayMinutes}m` : ""}
            {t.eta ? ` · ${t.eta}` : ""}
          </span>
        </span>
      </button>
      <Link
        to="/train/$number"
        params={{ number: t.trainNumber }}
        className="grid shrink-0 place-items-center px-3 text-xs text-muted hover:text-fg"
        preload="intent"
      >
        Run
      </Link>
    </li>
  );
});

function eventLabel(e: LiveTrain["lastEvent"]): string {
  switch (e) {
    case "AT_PLATFORM":
      return "at";
    case "APPROACHING":
      return "to";
    case "ARRIVED":
      return "at";
    case "DEPARTED":
      return "left";
    case "TERMINATED":
      return "ended";
  }
}
