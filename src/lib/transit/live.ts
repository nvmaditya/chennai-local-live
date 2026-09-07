import { stationOf } from "../../data/stations.ts";
import { rakeOf } from "../../data/rakes.ts";
import { simulateNetwork, simulateTrain } from "./simulator.ts";
import { boardFromSnap } from "./board.ts";
import type { DataSource, LiveTrain, NetworkSnapshot } from "./types.ts";

const CACHE_MS = 25_000;
let networkCache: { at: number; snap: NetworkSnapshot } | null = null;
let backoffUntil = 0;
let lastNtesOk = false;

const UAS = [
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1",
];

function ua(): string {
  return UAS[Math.floor(Date.now() / CACHE_MS) % UAS.length];
}

async function fetchNtesTrain(num: string): Promise<Partial<LiveTrain> | null> {
  if (Date.now() < backoffUntil) return null;
  const key = typeof process !== "undefined" ? process.env.IR_API_KEY : undefined;
  if (key) {
    try {
      const r = await fetch(`https://irctc1.p.rapidapi.com/api/v1/liveTrainStatus?trainNo=${encodeURIComponent(num)}`, {
        headers: {
          "X-RapidAPI-Key": key,
          "X-RapidAPI-Host": "irctc1.p.rapidapi.com",
        },
        signal: AbortSignal.timeout(2500),
      });
      if (r.status === 403 || r.status === 429) {
        backoffUntil = Date.now() + 5 * 60_000;
        return null;
      }
      if (!r.ok) return null;
      const json = (await r.json()) as { data?: { current_station_name?: string; delay?: number } };
      if (!json?.data) return null;
      return { delayMinutes: Number(json.data.delay) || 0, dataSource: "NTES" };
    } catch {
      return null;
    }
  }

  const url = `https://enquiry.indianrail.gov.in/mntes/q?opt=TrainRunningMob&subOpt=FindTrain&trainNo=${encodeURIComponent(num)}`;
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": ua(), Accept: "application/json,text/html" },
      signal: AbortSignal.timeout(2500),
    });
    if (r.status === 403 || r.status === 429) {
      backoffUntil = Date.now() + 5 * 60_000;
      return null;
    }
    if (!r.ok) return null;
    lastNtesOk = true;
    return { dataSource: "NTES" as DataSource };
  } catch {
    return null;
  }
}

export async function getNetworkSnapshot(nowMs: number = Date.now()): Promise<NetworkSnapshot> {
  if (networkCache && nowMs - networkCache.at < CACHE_MS) return networkCache.snap;
  const sim = simulateNetwork(nowMs);
  sim.ntesAttempted = false;
  sim.source = "SCHEDULE_SIM";
  networkCache = { at: nowMs, snap: sim };
  return sim;
}

export async function getTrainLive(num: string, nowMs: number = Date.now()): Promise<LiveTrain | null> {
  const snap = await getNetworkSnapshot(nowMs);
  const sim = snap.trains.find((t) => t.trainNumber === num) ?? simulateTrain(num, nowMs) ?? null;
  if (!sim) return buildGhost(num);
  const live = await fetchNtesTrain(num);
  if (live) {
    return {
      ...sim,
      delayMinutes: live.delayMinutes ?? sim.delayMinutes,
      dataSource: live.dataSource ?? sim.dataSource,
      lastUpdateTs: nowMs,
    };
  }
  return sim;
}

export async function getStationLive(code: string, nowMs: number = Date.now()) {
  const st = stationOf(code);
  if (!st) return null;
  const snap = await getNetworkSnapshot(nowMs);
  const trains = boardFromSnap(snap, code, 12);
  return { station: st, trains, generatedAt: snap.generatedAt };
}

function buildGhost(num: string): LiveTrain | null {
  if (!/^\d{4,5}$/.test(num)) return null;
  const rake = rakeOf("emu-12");
  return {
    trainNumber: num,
    name: `${num} EMU`,
    lineId: "south",
    origin: "MSB",
    destination: "TBM",
    rakeTemplateId: "emu-12",
    carCount: rake.carCount,
    lastReportedStation: "MSB",
    lastEvent: "DEPARTED",
    delayMinutes: 0,
    nextStation: "MSF",
    eta: null,
    platformLast: "2",
    platformNext: "2",
    lat: 13.0698,
    lng: 80.285,
    sx: 1110,
    sy: 432,
    heading: 0,
    progress: 0,
    direction: "DOWN",
    isFast: false,
    isAC: false,
    isLadiesSpecial: false,
    dataSource: "STALE",
    lastUpdateTs: Date.now(),
    leadingCab: "car1",
  };
}
