import { LINE_BY_ID, pathCodes, stationOf } from "./catalog.ts";
import { defaultPlatform } from "./geometry.ts";
import type { LiveTrain, NetworkSnapshot } from "./types.ts";

export function boardFromSnap(snap: NetworkSnapshot, code: string, take = 12): LiveTrain[] {
  const st = stationOf(code);
  if (!st) return [];
  const hits = snap.trains.filter((t) => {
    if (t.nextStation === code) return true;
    if (t.lastReportedStation === code && (t.lastEvent === "AT_PLATFORM" || t.lastEvent === "ARRIVED")) return true;
    return LINE_BY_ID[t.lineId].stations.includes(code);
  });
  const ranked = hits
    .map((t) => {
      const codes = LINE_BY_ID[t.lineId].stations;
      const iHere = codes.indexOf(code);
      const iLast = codes.indexOf(t.lastReportedStation);
      const iNext = t.nextStation ? codes.indexOf(t.nextStation) : -1;
      const toward = t.direction === "DOWN" ? iHere >= iLast : iHere <= iLast;
      const dist = Math.abs(iHere - iLast);
      return { t, dist, toward, approaching: iNext === iHere };
    })
    .filter((x) => x.toward || x.approaching)
    .sort((a, b) => Number(b.approaching) - Number(a.approaching) || a.dist - b.dist)
    .map((x) => x.t);

  const uniq: LiveTrain[] = [];
  const seen = new Set<string>();
  for (const t of ranked) {
    if (seen.has(t.trainNumber)) continue;
    seen.add(t.trainNumber);
    uniq.push(t);
    if (uniq.length >= take) break;
  }
  return uniq;
}

export function trainTimeline(train: LiveTrain): {
  code: string;
  name: string;
  eta: string | null;
  pf: string;
  current: boolean;
}[] {
  const codes = pathCodes(train.origin, train.destination, train.lineId);
  const iLast = codes.indexOf(train.lastReportedStation);
  return codes.map((code, i) => {
    const st = stationOf(code);
    return {
      code,
      name: st?.name ?? code,
      eta: i === iLast + 1 ? train.eta : null,
      pf: defaultPlatform(code, train.direction),
      current: code === train.lastReportedStation || code === train.nextStation,
    };
  });
}
