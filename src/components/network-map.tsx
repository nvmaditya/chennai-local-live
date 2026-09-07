import { Link } from "@tanstack/react-router";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { LINES } from "@/data/lines";
import { LINE_COLOUR, MAJOR, stationOf, stationsOn } from "@/lib/transit/catalog";
import type { LineId, LiveTrain, Station } from "@/lib/transit/types";
import { cn } from "@/lib/utils";

const OFFSET: Record<LineId, number> = { south: 0, west: -7, north: 7, mrts: 12 };

const LABELS: Record<string, { t: string; dx: number; dy: number; anchor?: "start" | "end" | "middle" }> = {
  MSB: { t: "Beach", dx: 12, dy: -10 },
  MASS: { t: "Central", dx: -10, dy: -14, anchor: "end" },
  MS: { t: "Egmore", dx: 10, dy: 16 },
  TBM: { t: "Tambaram", dx: 10, dy: -10 },
  CGL: { t: "Chengalpattu", dx: 12, dy: 6 },
  AVD: { t: "Avadi", dx: 0, dy: -16, anchor: "middle" },
  TRL: { t: "Tiruvallur", dx: 0, dy: -16, anchor: "middle" },
  AJJ: { t: "Arakkonam", dx: 0, dy: 18, anchor: "middle" },
  TRT: { t: "Tiruttani", dx: 14, dy: 4 },
  GPD: { t: "Gummidipoondi", dx: 12, dy: 4 },
  SPE: { t: "Sullurupeta", dx: 12, dy: 16 },
  VLCY: { t: "Velachery", dx: 12, dy: 16 },
  STM: { t: "St. Thomas Mt", dx: -12, dy: 18, anchor: "end" },
  GDY: { t: "Guindy", dx: 10, dy: -10 },
  MBM: { t: "Mambalam", dx: 10, dy: -10 },
  PER: { t: "Perambur", dx: 0, dy: 18, anchor: "middle" },
  TVT: { t: "Tiruvottiyur", dx: 12, dy: 4 },
  TYMR: { t: "Tiruvanmiyur", dx: 12, dy: 14 },
  CMP: { t: "Chromepet", dx: 10, dy: -10 },
};

type Cam = { x: number; y: number; k: number };

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
  const svgRef = useRef<SVGSVGElement>(null);
  const [cam, setCam] = useState<Cam>({ x: 0, y: 0, k: 1 });
  const drag = useRef<{ x: number; y: number; cx: number; cy: number; moved: boolean } | null>(null);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 1280;
      const my = ((e.clientY - rect.top) / rect.height) * 880;
      setCam((c) => {
        const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18;
        const k = Math.min(5.5, Math.max(0.85, c.k * factor));
        const wx = (mx - c.x) / c.k;
        const wy = (my - c.y) / c.k;
        return { k, x: mx - wx * k, y: my - wy * k };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    const t = e.target as Element;
    if (t.closest("[data-hit]")) return;
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, moved: false };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const el = svgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = ((e.clientX - d.x) / rect.width) * 1280;
    const dy = ((e.clientY - d.y) / rect.height) * 880;
    if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 4) d.moved = true;
    setCam((c) => ({ ...c, x: d.cx + dx, y: d.cy + dy }));
  }
  function onPointerUp() {
    drag.current = null;
  }

  const zoomBy = (factor: number) => {
    setCam((c) => {
      const k = Math.min(5.5, Math.max(0.85, c.k * factor));
      const cx = 640;
      const cy = 440;
      const wx = (cx - c.x) / c.k;
      const wy = (cy - c.y) / c.k;
      return { k, x: cx - wx * k, y: cy - wy * k };
    });
  };

  return (
    <div className="absolute inset-0">
      <svg
        ref={svgRef}
        viewBox="-24 -16 1328 920"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full touch-none select-none"
        role="img"
        aria-label="Schematic map of Chennai suburban and MRTS lines. Scroll to zoom, drag to pan."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <rect x="-24" y="-16" width="1328" height="920" fill="#07090d" />
        <g transform={`translate(${cam.x} ${cam.y}) scale(${cam.k})`}>
          {LINES.filter((l) => activeLines.includes(l.id)).map((line) => {
            const sts = stationsOn(line.id);
            const d = sts
              .map((s, i) => `${i === 0 ? "M" : "L"} ${s.sx} ${s.sy + OFFSET[line.id]}`)
              .join(" ");
            return (
              <g key={line.id}>
                <path
                  d={d}
                  fill="none"
                  stroke={LINE_COLOUR[line.id]}
                  strokeWidth={5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  opacity={0.92}
                />
                {sts.map((s) => (
                  <StationMark
                    key={line.id + s.code}
                    st={s}
                    line={line.id}
                    onSelect={(code) => {
                      onSelectStation(code);
                    }}
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
                onSelect={(train) => {
                  onSelectTrain(train);
                }}
              />
            ))}
        </g>
      </svg>
      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-2">
        {LINES.filter((l) => activeLines.includes(l.id)).map((l) => (
          <span
            key={l.id}
            className="pointer-events-none rounded-full bg-bg/80 px-2 py-0.5 text-xs text-muted ring-1 ring-border"
          >
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: l.colour }} />
            {l.name}
          </span>
        ))}
      </div>
      <div className="absolute bottom-3 right-3 flex flex-col gap-1">
        <MapBtn label="Zoom in" onClick={() => zoomBy(1.25)}>
          <Plus className="size-4" />
        </MapBtn>
        <MapBtn label="Zoom out" onClick={() => zoomBy(1 / 1.25)}>
          <Minus className="size-4" />
        </MapBtn>
        <MapBtn label="Reset map" onClick={() => setCam({ x: 0, y: 0, k: 1 })}>
          <RotateCcw className="size-4" />
        </MapBtn>
      </div>
    </div>
  );
}

function MapBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-11 w-11 place-items-center rounded-md border border-border bg-surface/90 text-fg shadow-panel backdrop-blur-sm"
    >
      {children}
    </button>
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
  const label = LABELS[st.code];
  const major = MAJOR.has(st.code);
  return (
    <g
      data-hit="station"
      className="cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(st.code);
      }}
      aria-label={st.name}
    >
      <title>{st.name}</title>
      <circle cx={st.sx} cy={y} r={14} fill="transparent" />
      <circle
        cx={st.sx}
        cy={y}
        r={major ? 5 : 3}
        fill="#07090d"
        stroke={LINE_COLOUR[line]}
        strokeWidth={1.6}
      />
      {label ? (
        <text
          x={st.sx + label.dx}
          y={y + label.dy}
          fill="#e8edf2"
          fontSize={11}
          fontFamily="IBM Plex Sans, sans-serif"
          textAnchor={label.anchor ?? "start"}
          style={{ pointerEvents: "none" }}
        >
          {label.t}
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
  const len = train.carCount >= 12 ? 28 : 20;
  const y = train.sy + OFFSET[train.lineId];
  const rot = (train.heading * 180) / Math.PI;
  const dest = stationOf(train.destination);
  return (
    <g
      data-hit="train"
      transform={`translate(${train.sx} ${y}) rotate(${rot})`}
      className="cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(train);
      }}
      role="button"
      aria-label={`Train ${train.trainNumber} to ${dest?.name ?? train.destination}`}
    >
      <title>{`${train.trainNumber} → ${dest?.name ?? train.destination}`}</title>
      <rect x={-18} y={-14} width={36} height={28} fill="transparent" />
      <rect
        x={-len / 2}
        y={-5}
        width={len}
        height={10}
        rx={4}
        fill={LINE_COLOUR[train.lineId]}
        stroke={selected ? "#e8edf2" : "#07090d"}
        strokeWidth={selected ? 2 : 1}
      />
      {train.isAC ? <rect x={-4} y={-2} width={8} height={4} rx={1} fill="#07090d" opacity={0.45} /> : null}
    </g>
  );
}

function rankTrain(t: LiveTrain): number {
  if (t.lastEvent === "AT_PLATFORM" || t.lastEvent === "ARRIVED") return 0;
  if (t.lastEvent === "APPROACHING") return 1;
  return 2;
}

export function TrainList({
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
          <section key={line.id}>
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
}

function TrainRow({
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
      >
        Run
      </Link>
    </li>
  );
}

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
