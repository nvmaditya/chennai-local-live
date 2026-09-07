import { Link } from "@tanstack/react-router";
import { LINES } from "@/data/lines";
import { MAJOR, stationsOn } from "@/lib/transit/catalog";
import type { LineId, LiveTrain, Station } from "@/lib/transit/types";
import { cn } from "@/lib/utils";
import { STATIONS } from "@/data/stations";

const COLOUR: Record<LineId, string> = {
  south: "#e4453a",
  west: "#2fbf71",
  north: "#4a90ff",
  mrts: "#e0a21a",
};

const OFFSET: Record<LineId, number> = { south: 0, west: -6, north: 6, mrts: 10 };

export function NetworkMap({
  trains,
  activeLines,
  selected,
  onSelectTrain,
  onSelectStation,
}: {
  trains: LiveTrain[];
  activeLines: LineId[];
  selected?: string | null;
  onSelectTrain: (t: LiveTrain) => void;
  onSelectStation: (code: string) => void;
}) {
  const vb = "0 0 1280 880";
  return (
    <svg
      viewBox={vb}
      className="h-full w-full min-h-[420px] touch-manipulation"
      role="img"
      aria-label="Schematic map of Chennai suburban and MRTS lines with live trains"
    >
      <rect width="1280" height="880" fill="#07090d" />
      {LINES.filter((l) => activeLines.includes(l.id)).map((line) => {
        const sts = stationsOn(line.id);
        const d = sts
          .map((s, i) => `${i === 0 ? "M" : "L"} ${s.sx} ${s.sy + OFFSET[line.id]}`)
          .join(" ");
        return (
          <g key={line.id}>
            <path d={d} fill="none" stroke={COLOUR[line.id]} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" opacity={0.9} />
            {sts.map((s) => (
              <StationMark
                key={line.id + s.code}
                st={s}
                line={line.id}
                onSelect={onSelectStation}
              />
            ))}
          </g>
        );
      })}
      {trains
        .filter((t) => activeLines.includes(t.lineId))
        .map((t) => (
          <TrainMark
            key={t.trainNumber}
            train={t}
            selected={selected === t.trainNumber}
            onSelect={onSelectTrain}
          />
        ))}
      <Legend />
    </svg>
  );
}

function StationMark({
  st,
  line,
  onSelect,
}: {
  st: Station;
  line: LineId;
  onSelect: (code: string) => void;
}) {
  const y = st.sy + OFFSET[line];
  const major = MAJOR.has(st.code);
  return (
    <g
      className="cursor-pointer"
      onClick={() => onSelect(st.code)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(st.code);
      }}
      tabIndex={0}
      role="link"
      aria-label={st.name}
    >
      <circle cx={st.sx} cy={y} r={major ? 5 : 3} fill="#07090d" stroke={COLOUR[line]} strokeWidth={1.6} />
      {major ? (
        <text
          x={st.sx + 8}
          y={y - 8}
          fill="#e8edf2"
          fontSize={10}
          fontFamily="IBM Plex Sans, sans-serif"
        >
          {st.name}
        </text>
      ) : null}
    </g>
  );
}

function TrainMark({
  train,
  selected,
  onSelect,
}: {
  train: LiveTrain;
  selected: boolean;
  onSelect: (t: LiveTrain) => void;
}) {
  const len = train.carCount >= 12 ? 26 : 18;
  const y = train.sy + OFFSET[train.lineId];
  const rot = (train.heading * 180) / Math.PI;
  return (
    <g
      transform={`translate(${train.sx} ${y}) rotate(${rot})`}
      className="cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(train);
      }}
      role="button"
      tabIndex={0}
      aria-label={`Train ${train.trainNumber} to ${train.destination}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(train);
      }}
    >
      <rect
        x={-len / 2}
        y={-5}
        width={len}
        height={10}
        rx={4}
        fill={COLOUR[train.lineId]}
        stroke={selected ? "#e8edf2" : "#07090d"}
        strokeWidth={selected ? 2 : 1}
      />
      {train.isAC ? (
        <rect x={-4} y={-2} width={8} height={4} rx={1} fill="#07090d" opacity={0.5} />
      ) : null}
    </g>
  );
}

function Legend() {
  return (
    <g transform="translate(24 820)">
      {LINES.map((l, i) => (
        <g key={l.id} transform={`translate(${i * 160} 0)`}>
          <rect width="18" height="6" rx="3" y="4" fill={COLOUR[l.id]} />
          <text x="24" y="10" fill="#8b93a0" fontSize="11" fontFamily="IBM Plex Sans, sans-serif">
            {l.name}
          </text>
        </g>
      ))}
    </g>
  );
}

export function TrainList({
  trains,
  onSelect,
  selected,
}: {
  trains: LiveTrain[];
  onSelect: (t: LiveTrain) => void;
  selected?: string | null;
}) {
  if (!trains.length) {
    return <p className="px-4 py-8 text-sm text-muted">No trains on the selected lines right now.</p>;
  }
  return (
    <ul className="divide-y divide-border">
      {trains.map((t) => {
        const dest = STATIONS.find((s) => s.code === t.destination);
        const last = STATIONS.find((s) => s.code === t.lastReportedStation);
        return (
          <li key={t.trainNumber} className="flex items-start gap-0">
            <button
              type="button"
              onClick={() => onSelect(t)}
              className={cn(
                "flex min-w-0 flex-1 items-start gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-elevated",
                selected === t.trainNumber && "bg-elevated",
              )}
            >
              <span
                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: COLOUR[t.lineId] }}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-mono text-sm tabular">{t.trainNumber}</span>
                  <span className="truncate text-sm">{dest?.name ?? t.destination}</span>
                  {t.isAC ? <span className="text-[10px] uppercase tracking-wider text-ac">AC</span> : null}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {t.lastEvent.replace("_", " ").toLowerCase()} {last?.name ?? t.lastReportedStation}
                  {t.nextStation ? ` → ${t.nextStation}` : ""} · PF {t.platformNext}
                  {t.delayMinutes ? ` · +${t.delayMinutes}m` : " · on time"}
                </span>
              </span>
            </button>
            <Link
              to="/train/$number"
              params={{ number: t.trainNumber }}
              className="shrink-0 px-3 py-3 text-xs text-muted hover:text-fg"
            >
              Open
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
