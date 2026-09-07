import type { TimeBand } from "./types.ts";

const IST = "Asia/Kolkata";

export function istDate(ms: number = Date.now()): Date {
  const s = new Date(ms).toLocaleString("en-US", { timeZone: IST });
  return new Date(s);
}

export function minutesOfDay(ms: number = Date.now()): number {
  const d = istDate(ms);
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

export function clockLabel(ms: number = Date.now()): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(ms));
}

export function weekdayShort(ms: number = Date.now()): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date(ms));
}

export function timeBand(min: number): TimeBand {
  if (min >= 7 * 60 && min < 10 * 60) return "AM_PEAK";
  if (min >= 16 * 60 + 30 && min < 20 * 60) return "PM_PEAK";
  if (min >= 21 * 60 || min < 5 * 60) return "LATE";
  return "MID";
}

export function isPeak(band: TimeBand): boolean {
  return band === "AM_PEAK" || band === "PM_PEAK";
}

export function formatHm(min: number): string {
  const m = ((Math.round(min) % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function parseHm(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Deterministic 0..1 from a string (train number, station, …). */
export function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}
