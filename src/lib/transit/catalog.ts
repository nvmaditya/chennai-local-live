import { LINES, LINE_BY_ID } from "../../data/lines.ts";
import { STATION_BY_CODE, STATIONS, stationOf, stationsOn } from "../../data/stations.ts";
import type { Direction, LineId, Station } from "./types.ts";

export {
  LINES,
  LINE_BY_ID,
  STATIONS,
  STATION_BY_CODE,
  stationOf,
  stationsOn,
};

export const LINE_COLOUR: Record<LineId, string> = {
  south: "#e4453a",
  west: "#2fbf71",
  north: "#4a90ff",
  mrts: "#e0a21a",
};

export function searchStations(q: string, limit = 12): Station[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const scored: { st: Station; n: number }[] = [];
  for (const st of STATIONS) {
    if (st.code.toLowerCase() === s) {
      scored.push({ st, n: 0 });
      continue;
    }
    if (st.aliases?.some((a) => a.toLowerCase() === s)) {
      scored.push({ st, n: 1 });
      continue;
    }
    const name = st.name.toLowerCase();
    const ta = st.nameTa;
    if (name.startsWith(s) || st.code.toLowerCase().startsWith(s)) scored.push({ st, n: 2 });
    else if (name.includes(s) || ta.includes(q.trim()) || st.aliases?.some((a) => a.toLowerCase().includes(s)))
      scored.push({ st, n: 3 });
  }
  scored.sort((a, b) => a.n - b.n || a.st.name.localeCompare(b.st.name));
  const seen = new Set<string>();
  const out: Station[] = [];
  for (const x of scored) {
    if (seen.has(x.st.code)) continue;
    seen.add(x.st.code);
    out.push(x.st);
    if (out.length >= limit) break;
  }
  return out;
}

export function nextStation(code: string, line: LineId, dir: Direction): Station | undefined {
  const codes = LINE_BY_ID[line].stations;
  const i = codes.indexOf(code);
  if (i < 0) return undefined;
  const j = dir === "DOWN" ? i + 1 : i - 1;
  if (j < 0 || j >= codes.length) return undefined;
  return stationOf(codes[j]);
}

export function prevStations(code: string, line: LineId, dir: Direction, n = 3): Station[] {
  const codes = LINE_BY_ID[line].stations;
  const i = codes.indexOf(code);
  if (i < 0) return [];
  const out: Station[] = [];
  for (let k = 1; k <= n; k++) {
    const j = dir === "DOWN" ? i - k : i + k;
    if (j < 0 || j >= codes.length) break;
    const st = stationOf(codes[j]);
    if (st) out.push(st);
  }
  return out;
}

export function pathCodes(origin: string, dest: string, line: LineId): string[] {
  const codes = LINE_BY_ID[line].stations;
  const a = codes.indexOf(origin);
  const b = codes.indexOf(dest);
  if (a < 0 || b < 0) return [origin, dest];
  if (a <= b) return codes.slice(a, b + 1);
  return codes.slice(b, a + 1).reverse();
}

export function kmAlong(code: string, line: LineId): number {
  return stationOf(code)?.km[line] ?? 0;
}

export function interpolateGeo(
  a: Station,
  b: Station,
  t: number,
): { lat: number; lng: number; sx: number; sy: number; heading: number } {
  const lat = a.lat + (b.lat - a.lat) * t;
  const lng = a.lng + (b.lng - a.lng) * t;
  const sx = a.sx + (b.sx - a.sx) * t;
  const sy = a.sy + (b.sy - a.sy) * t;
  const heading = Math.atan2(b.sy - a.sy, b.sx - a.sx);
  return { lat, lng, sx, sy, heading };
}

export const MAJOR = new Set([
  "MSB", "MASS", "MS", "MSF", "MPK", "STM", "TBM", "CGL", "AVD", "TRL", "AJJ",
  "TRT", "GPD", "SPE", "VLCY", "GDY", "MBM", "PER", "TVT", "TYMR", "MTMY",
  "CMP", "ABU", "ENR", "BBQ",
]);
