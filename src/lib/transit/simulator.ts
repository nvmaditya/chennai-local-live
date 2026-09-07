import { CORRIDORS, REAL_NUMBERS, directionOf, reverseCorridor, type Corridor } from "../../data/corridors.ts";
import { rakeOf } from "../../data/rakes.ts";
import { interpolateGeo, kmAlong, pathCodes, stationOf } from "./catalog.ts";
import { defaultPlatform } from "./geometry.ts";
import { boardFromSnap } from "./board.ts";
import { leadingFor } from "./crowd.ts";
import { clockLabel, formatHm, hash01, isPeak, minutesOfDay, timeBand } from "./time.ts";
import type { Direction, LiveTrain, NetworkSnapshot, SeedService, SeedStop, TrainEvent } from "./types.ts";

function headwayAt(c: Corridor, min: number): number {
  const band = timeBand(min);
  if (isPeak(band)) return c.peakHeadway;
  if (band === "LATE") return c.offPeakHeadway + 8;
  return c.offPeakHeadway;
}

function departures(c: Corridor): number[] {
  const out: number[] = [];
  let t = c.firstMin;
  while (t <= c.lastMin) {
    out.push(t);
    t += headwayAt(c, t);
  }
  return out;
}

function travelPlan(origin: string, dest: string, lineId: Corridor["lineId"]): SeedStop[] {
  const codes = pathCodes(origin, dest, lineId);
  const stops: SeedStop[] = [];
  let acc = 0;
  for (let i = 0; i < codes.length; i++) {
    if (i > 0) {
      const dkm = Math.abs(kmAlong(codes[i], lineId) - kmAlong(codes[i - 1], lineId));
      const run = Math.max(1.15, (dkm / 42) * 60);
      acc += run;
    }
    const dir: Direction = kmAlong(dest, lineId) > kmAlong(origin, lineId) ? "DOWN" : "UP";
    const terminal = i === codes.length - 1 || i === 0;
    const pf = defaultPlatform(codes[i], terminal && i === codes.length - 1 ? "TERMINATING" : dir);
    const dwell = i === 0 || i === codes.length - 1 ? 1.2 : 0.45;
    stops.push({
      code: codes[i],
      arrMin: acc,
      depMin: acc + (i === codes.length - 1 ? 0 : dwell),
    platform: pf,
    });
    acc += i === codes.length - 1 ? 0 : dwell;
  }
  return stops;
}

function trainNumber(c: Corridor, depMin: number, dir: Direction): string {
  const series = dir === "DOWN" ? c.seriesDown : c.seriesUp;
  const slot = Math.round(depMin / 2) % 400;
  const n = series + (slot % 2 === (series % 2) ? slot : slot + 1);
  const raw = String(n);
  return raw;
}

function delayMin(num: string, band: ReturnType<typeof timeBand>): number {
  const h = hash01(num + band);
  if (band === "AM_PEAK" || band === "PM_PEAK") return Math.floor(h * 13);
  if (band === "LATE") return Math.floor(h * 6);
  return Math.floor(h * 4);
}

const ALL_CORRIDORS: Corridor[] = CORRIDORS.flatMap((c) => [c, reverseCorridor(c)]);

const PLAN_CACHE = new Map<string, SeedStop[]>();
function planFor(c: Corridor): SeedStop[] {
  const k = `${c.origin}|${c.dest}|${c.lineId}`;
  const hit = PLAN_CACHE.get(k);
  if (hit) return hit;
  const p = travelPlan(c.origin, c.dest, c.lineId);
  PLAN_CACHE.set(k, p);
  return p;
}

function eventAt(rel: number, stops: SeedStop[]): { idx: number; event: TrainEvent; t: number } {
  for (let i = 0; i < stops.length; i++) {
    const s = stops[i];
    if (rel < s.arrMin - 0.7) {
      return { idx: Math.max(0, i - 1), event: "APPROACHING", t: rel };
    }
    if (rel < s.depMin) {
      return { idx: i, event: i === stops.length - 1 ? "TERMINATED" : "AT_PLATFORM", t: rel };
    }
  }
  return { idx: stops.length - 1, event: "TERMINATED", t: rel };
}

export function simulateNetwork(nowMs: number = Date.now()): NetworkSnapshot {
  const nowMin = minutesOfDay(nowMs);
  const band = timeBand(nowMin);
  const trains: LiveTrain[] = [];
  const seen = new Set<string>();

  for (const c of ALL_CORRIDORS) {
    const dir = directionOf(c);
    const stops = planFor(c);
    const trip = stops[stops.length - 1]?.arrMin ?? 40;
    const deps = departures(c);
    const rake = rakeOf(c.rakeTemplateId);

    for (const dep of deps) {
      if (nowMin + 2 < dep) continue;
      if (nowMin > dep + trip + 18) continue;

      let num = trainNumber(c, dep, dir);
      if (seen.has(num)) num = String(Number(num) + 2);
      if (seen.has(num)) continue;
      seen.add(num);

      const delay = delayMin(num, band);
      const rel = nowMin - dep - delay;
      if (rel < -0.5) continue;
      if (rel > trip + 4) continue;

      const ev = eventAt(rel, stops);
      const last = stops[ev.idx];
      const next = stops[ev.idx + 1] ?? null;
      const lastSt = stationOf(last.code)!;
      const nextSt = next ? stationOf(next.code) : undefined;

      let t = 0;
      let geo = { lat: lastSt.lat, lng: lastSt.lng, sx: lastSt.sx, sy: lastSt.sy, heading: 0 };
      let progress = 0;
      if (nextSt && next) {
        const span = Math.max(0.4, next.arrMin - last.depMin);
        t = clamp((rel - last.depMin) / span, 0, 1);
        if (ev.event === "AT_PLATFORM" || ev.event === "TERMINATED") t = 0;
        if (ev.event === "APPROACHING") t = clamp(1 - (last.arrMin - rel) / 0.8, 0.7, 0.98);
        geo = interpolateGeo(lastSt, nextSt, t);
        progress = (ev.idx + t) / (stops.length - 1);
      } else {
        progress = 1;
      }

      const name = REAL_NUMBERS[num] ?? `${c.origin}–${c.dest} ${c.isAC ? "AC " : ""}${c.lineId === "mrts" ? "MRTS" : "EMU"}`;

      trains.push({
        trainNumber: num,
        name,
        lineId: c.lineId,
        origin: c.origin,
        destination: c.dest,
        via: c.via,
        rakeTemplateId: c.rakeTemplateId,
        carCount: rake.carCount,
        lastReportedStation: last.code,
        lastEvent: ev.event,
        delayMinutes: delay,
        nextStation: next?.code ?? null,
        eta: next ? formatHm(dep + delay + next.arrMin) : null,
        platformLast: last.platform,
        platformNext: next?.platform ?? last.platform,
        lat: geo.lat,
        lng: geo.lng,
        sx: geo.sx,
        sy: geo.sy,
        heading: geo.heading,
        progress,
        direction: dir,
        isFast: c.isFast,
        isAC: c.isAC,
        isLadiesSpecial: c.isLadiesSpecial,
        dataSource: "SCHEDULE_SIM",
        lastUpdateTs: nowMs,
        leadingCab: leadingFor(dir),
      });
    }
  }

  trains.sort((a, b) => a.lineId.localeCompare(b.lineId) || a.trainNumber.localeCompare(b.trainNumber));

  return {
    generatedAt: nowMs,
    clockLabel: clockLabel(nowMs),
    source: "SCHEDULE_SIM",
    ntesAttempted: false,
    trains,
    liveCount: 0,
    simulatedCount: trains.length,
  };
}

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

export function simulateTrain(num: string, nowMs: number = Date.now()): LiveTrain | undefined {
  const snap = simulateNetwork(nowMs);
  return snap.trains.find((t) => t.trainNumber === num);
}

export function stationBoard(code: string, nowMs: number = Date.now(), take = 12): LiveTrain[] {
  return boardFromSnap(simulateNetwork(nowMs), code, take);
}

export function buildSeedTimetable(): SeedService[] {
  const services: SeedService[] = [];
  const windows = [8 * 60, 18 * 60];
  for (const c of ALL_CORRIDORS) {
    const dir = directionOf(c);
    const stops0 = planFor(c);
    const rake = c.rakeTemplateId;
    const deps = departures(c);
    for (const w of windows) {
      const near = deps.filter((d) => Math.abs(d - w) < 50).slice(0, 3);
      for (const dep of near) {
        const num = trainNumber(c, dep, dir);
        services.push({
          trainNumber: num,
          name: REAL_NUMBERS[num] ?? `${c.origin}–${c.dest} EMU`,
          lineId: c.lineId,
          origin: c.origin,
          destination: c.dest,
          via: c.via,
          rakeTemplateId: rake,
          direction: dir,
          isFast: c.isFast,
          isAC: c.isAC,
          isLadiesSpecial: c.isLadiesSpecial,
          stops: stops0.map((s) => ({
            ...s,
            arrMin: dep + s.arrMin,
            depMin: dep + s.depMin,
          })),
        });
      }
    }
  }
  return services;
}

export { trainTimeline } from "./board.ts";