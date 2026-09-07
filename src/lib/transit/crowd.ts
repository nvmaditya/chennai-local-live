import { isFirstClassCar, isLadiesCar, rakeOf } from "../../data/rakes.ts";
import { geometryFor } from "./geometry.ts";
import { kmAlong, pathCodes, prevStations, stationOf } from "./catalog.ts";
import { timeBand } from "./time.ts";
import type {
  CrowdResult,
  Direction,
  LeadingCab,
  LineId,
  LiveTrain,
  StationGeometry,
  TimeBand,
} from "./types.ts";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function smooth(arr: number[]): number[] {
  const out = arr.slice();
  for (let i = 0; i < arr.length; i++) {
    const l = arr[i - 1] ?? arr[i];
    const r = arr[i + 1] ?? arr[i];
    out[i] = 0.15 * l + 0.7 * arr[i] + 0.15 * r;
  }
  return out.map(clamp01);
}

function zoneTriple(n: number): { f: number; m: number; r: number } {
  if (n <= 9) return { f: 3, m: 3, r: n - 6 };
  return { f: 4, m: n - 8, r: 4 };
}

/** Map a platform fraction (0 = city/zeroEnd, 1 = suburb end) onto a car index 1..N
 *  given which cab is leading. Car 1 is the nominal origin cab (MSB/MASS end). */
function carsInDump(
  from: number,
  to: number,
  n: number,
  leading: LeadingCab,
): number[] {
  const hits: number[] = [];
  for (let i = 1; i <= n; i++) {
    const cityFrac =
      leading === "car1"
        ? 1 - (i - 0.5) / n // DOWN: car1 at suburb end
        : (i - 0.5) / n; // UP: car1 at city end after reverse
    if (cityFrac >= from - 0.04 && cityFrac <= to + 0.04) hits.push(i);
  }
  if (hits.length === 0) {
    const mid = (from + to) / 2;
    const i =
      leading === "car1"
        ? Math.round((1 - mid) * (n - 1)) + 1
        : Math.round(mid * (n - 1)) + 1;
    hits.push(Math.max(1, Math.min(n, i)));
  }
  return hits;
}

function dumpCars(g: StationGeometry, n: number, leading: LeadingCab, platformId?: string): number[] {
  const primary = g.accesses.filter((a) => a.isPrimaryPeakEntry);
  const list = primary.length ? primary : g.accesses;
  const set = new Set<number>();
  for (const a of list) {
    for (const z of a.dumpZone) {
      if (platformId && z.platformId !== platformId) continue;
      for (const i of carsInDump(z.from, z.to, n, leading)) set.add(i);
    }
  }
  if (set.size === 0) {
    return Array.from({ length: n }, (_, k) => k + 1);
  }
  return [...set];
}

function stationRank(code: string): "origin" | "major" | "regular" {
  const st = stationOf(code);
  if (!st) return "regular";
  if (st.terminal) return "origin";
  if (st.interchange) return "major";
  return "regular";
}

function mixFor(band: TimeBand): { board: number; alight: number; female: number } {
  if (band === "AM_PEAK") return { board: 1, alight: 0.85, female: 0.28 };
  if (band === "PM_PEAK") return { board: 0.95, alight: 1, female: 0.32 };
  if (band === "LATE") return { board: 0.45, alight: 0.55, female: 0.22 };
  return { board: 0.6, alight: 0.6, female: 0.3 };
}

function applyZone(occ: number[], n: number, zone: { front: number; mid: number; rear: number }, amount: number) {
  const z = zoneTriple(n);
  const add = (start: number, count: number, share: number) => {
    if (count <= 0) return;
    const each = (amount * share) / count;
    for (let i = 0; i < count; i++) occ[start + i] = clamp01(occ[start + i] + each);
  };
  add(0, z.f, zone.front);
  add(z.f, z.m, zone.mid);
  add(z.f + z.m, z.r, zone.rear);
}

function addToCars(occ: number[], cars: number[], amount: number) {
  if (!cars.length) return;
  const each = amount / cars.length;
  for (const i of cars) occ[i - 1] = clamp01(occ[i - 1] + each);
}

function subFromCars(occ: number[], cars: number[], amount: number) {
  if (!cars.length) return;
  const each = amount / cars.length;
  for (const i of cars) occ[i - 1] = clamp01(occ[i - 1] - each);
}

export function leadingFor(dir: Direction): LeadingCab {
  // Outbound from city: origin cab (car 1) leads. Reverse at suburb: car N leads back.
  return dir === "DOWN" ? "car1" : "carN";
}

export function crowdAtStation(
  opts: {
    lineId: LineId;
    direction: Direction;
    origin: string;
    destination: string;
    arrivingAt: string;
    rakeTemplateId: string;
    leadingCab?: LeadingCab;
    previous?: string[];
    nowMs?: number;
  },
): CrowdResult {
  const rake = rakeOf(opts.rakeTemplateId);
  const n = rake.carCount;
  const occ = Array.from({ length: n }, () => 0.08);
  const leading = opts.leadingCab ?? leadingFor(opts.direction);
  const band = timeBand(minutesSafe(opts.nowMs));
  const mix = mixFor(band);
  const path = pathCodes(opts.origin, opts.destination, opts.lineId);
  const destIdx = path.indexOf(opts.arrivingAt);
  const end = destIdx >= 0 ? destIdx : path.length - 1;
  const walk = path.slice(0, end + 1);

  const ladiesIdx = rake.cars.filter((c) => c.class === "LADIES" || c.class === "AC_LADIES").map((c) => c.index);
  const ladiesAll = rake.cars.filter((c) => isLadiesCar(c.class)).map((c) => c.index);
  const fcIdx = rake.cars.filter((c) => isFirstClassCar(c.class) && !isLadiesCar(c.class)).map((c) => c.index);
  const dmcIdx = rake.cars.filter((c) => c.type === "DMC").map((c) => c.index);

  for (let s = 0; s < walk.length; s++) {
    const code = walk[s];
    const g = geometryFor(code);
    if (!g) continue;
    const rank = stationRank(code);
    const isOrigin = s === 0;
    const isHere = s === walk.length - 1;
    const alightShare =
      isOrigin ? 0 : rank === "origin" ? 0.55 : rank === "major" ? 0.28 : 0.12;
    const boardShare = isHere
      ? 0
      : isOrigin
        ? 0.85
        : rank === "origin"
          ? 0.5
          : rank === "major"
            ? 0.32
            : 0.14;
    const dump = dumpCars(g, n, leading);

    if (!isOrigin) {
      subFromCars(occ, dump, alightShare * mix.alight * 0.7);
      // through-riders also leak slightly from ends
      for (let i = 0; i < n; i++) occ[i] = clamp01(occ[i] * (1 - alightShare * 0.25));
    }

    if (boardShare > 0) {
      const vol = boardShare * mix.board;
      applyZone(occ, n, g.boardingBias[opts.direction], vol * 0.45);
      addToCars(occ, dump, vol * 0.55);

      const female = vol * mix.female;
      if (ladiesAll.length) {
        addToCars(occ, ladiesAll, female * 0.85);
        const spill = ladiesAll.flatMap((i) => [i - 1, i + 1]).filter((i) => i >= 1 && i <= n);
        addToCars(occ, spill, female * 0.15);
      }

      if (fcIdx.length) addToCars(occ, fcIdx, vol * 0.04);
      const stairAtEnd = dump.some((i) => i <= 2 || i >= n - 1);
      if (stairAtEnd) addToCars(occ, dmcIdx, vol * 0.06);
    }
  }

  // Destination mix: some already standing for the arriving station's exits
  const here = geometryFor(opts.arrivingAt);
  if (here) {
    const dump = dumpCars(here, n, leading);
    addToCars(occ, dump, 0.08);
  }

  const smoothed = smooth(smooth(occ));
  const z = zoneTriple(n);
  const avg = (a: number, b: number) => {
    let t = 0;
    for (let i = a; i < b; i++) t += smoothed[i];
    return t / Math.max(1, b - a);
  };
  const front = avg(0, z.f);
  const mid = avg(z.f, z.f + z.m);
  const rear = avg(z.f + z.m, n);

  const prev = opts.previous ?? prevStations(opts.arrivingAt, opts.lineId, opts.direction, 3).map((p) => p.code);
  const sentence = buildSentence({
    n,
    dir: opts.direction,
    at: opts.arrivingAt,
    prev,
    front,
    mid,
    rear,
    ladiesIdx,
    here,
    leading,
  });

  return {
    occupancy: smoothed,
    front,
    mid,
    rear,
    sentence,
    band,
    ladiesCars: ladiesIdx,
  };
}

function minutesSafe(ms?: number): number {
  if (ms == null) return 12 * 60;
  const d = new Date(
    new Date(ms).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );
  return d.getHours() * 60 + d.getMinutes();
}

function hottest(front: number, mid: number, rear: number): "front" | "mid" | "rear" {
  if (mid >= front && mid >= rear) return "mid";
  if (front >= rear) return "front";
  return "rear";
}

function buildSentence(opts: {
  n: number;
  dir: Direction;
  at: string;
  prev: string[];
  front: number;
  mid: number;
  rear: number;
  ladiesIdx: number[];
  here?: StationGeometry;
  leading: LeadingCab;
}): string {
  const st = stationOf(opts.at);
  const name = st?.name ?? opts.at;
  const hot = hottest(opts.front, opts.mid, opts.rear);
  const z = zoneTriple(opts.n);
  const range =
    hot === "front"
      ? `cars 1–${z.f}`
      : hot === "rear"
        ? `cars ${z.f + z.m + 1}–${opts.n}`
        : `cars ${z.f + 1}–${z.f + z.m}`;
  const ladies =
    opts.ladiesIdx.length > 0
      ? ` Ladies block ${opts.ladiesIdx[0]}–${opts.ladiesIdx[opts.ladiesIdx.length - 1]}.`
      : "";
  const prevName = opts.prev[0] ? stationOf(opts.prev[0])?.name ?? opts.prev[0] : null;
  const gNote = opts.here?.peakNotes.split(".")[0] ?? "";
  const conf = opts.here?.confidence === "inferred" ? " Layout is inferred." : "";
  const door = opts.here?.platforms[0]?.doorsOpen
    ? ` Doors ${opts.here.platforms[0].doorsOpen} on the default face.`
    : "";
  const from = prevName ? ` After ${prevName},` : "";
  return `${opts.n}-car ${opts.dir} arriving ${name}:${from} ${hot} ${range} hottest.${ladies}${door} ${gNote}.${conf}`.replace(
    /\s+/g,
    " ",
  ).trim();
}

export function crowdForTrain(train: LiveTrain, arrivingAt: string, previous?: string[]): CrowdResult {
  return crowdAtStation({
    lineId: train.lineId,
    direction: train.direction,
    origin: train.origin,
    destination: train.destination,
    arrivingAt,
    rakeTemplateId: train.rakeTemplateId,
    leadingCab: train.leadingCab,
    previous,
  });
}

export function standHint(
  boardedAt: string,
  exitAt: string,
  lineId: LineId,
  direction: Direction,
  rakeId: string,
): string {
  const rake = rakeOf(rakeId);
  const gExit = geometryFor(exitAt);
  const gBoard = geometryFor(boardedAt);
  if (!gExit) return "Stand near a door you can see a stair from — suburban FOBs are rarely at both ends.";
  const leading = leadingFor(direction);
  const cars = carsInDump(
    gExit.accesses[0]?.dumpZone[0]?.from ?? 0.35,
    gExit.accesses[0]?.dumpZone[0]?.to ?? 0.55,
    rake.carCount,
    leading,
  );
  const board = gBoard?.name ?? boardedAt;
  const exit = gExit.name;
  const span = cars.length ? `${Math.min(...cars)}–${Math.max(...cars)}` : "mid";
  return `Stand in cars ${span} if you boarded at ${board} and want an easy exit at ${exit}.`;
}

export function kmBetween(a: string, b: string, line: LineId): number {
  return Math.abs(kmAlong(b, line) - kmAlong(a, line));
}
