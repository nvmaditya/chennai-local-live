import { useCallback, useEffect, useState } from "react";
import type { NetworkSnapshot } from "./types";

const CLIENT_TTL = 12_000;
let mem: { at: number; snap: NetworkSnapshot } | null = null;
let inflight: Promise<NetworkSnapshot> | null = null;

function fetchNetwork(signal?: AbortSignal): Promise<NetworkSnapshot> {
  if (mem && Date.now() - mem.at < CLIENT_TTL) return Promise.resolve(mem.snap);
  if (inflight) return inflight;
  inflight = fetch("/api/live/network", {
    signal,
    headers: { Accept: "application/json" },
  })
    .then((r) => {
      if (!r.ok) throw new Error("network");
      return r.json() as Promise<NetworkSnapshot>;
    })
    .then((snap) => {
      mem = { at: Date.now(), snap };
      return snap;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

const boot: Promise<NetworkSnapshot> | null = typeof window !== "undefined" ? fetchNetwork() : null;

export function useLiveNetwork(pollMs = 20_000) {
  const [snap, setSnap] = useState<NetworkSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const json = await fetchNetwork(signal);
      setSnap(json);
      setError(null);
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return;
      if (mem?.snap) {
        setSnap(mem.snap);
        return;
      }
      try {
        const { simulateNetwork } = await import("./simulator");
        const fallback = simulateNetwork(Date.now());
        mem = { at: Date.now(), snap: fallback };
        setSnap(fallback);
        setError(null);
      } catch {
        setError("board");
      }
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    if (mem?.snap) setSnap(mem.snap);
    const start = boot ?? load(ac.signal);
    void Promise.resolve(start)
      .then((s) => {
        if (s && "trains" in s) {
          setSnap(s);
          setError(null);
        }
      })
      .catch(() => load(ac.signal));

    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void load();
    };
    const id = setInterval(tick, pollMs);
    const onVis = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      ac.abort();
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load, pollMs]);

  return { snap, error, reload: load };
}
