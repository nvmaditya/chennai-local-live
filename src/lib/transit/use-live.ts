import { useCallback, useEffect, useState } from "react";
import { simulateNetwork } from "./simulator";
import type { NetworkSnapshot } from "./types";

export function useLiveNetwork(pollMs = 20_000) {
  const [snap, setSnap] = useState<NetworkSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/live/network");
      if (!r.ok) throw new Error("network");
      const json = (await r.json()) as NetworkSnapshot;
      setSnap(json);
      setError(null);
    } catch {
      setSnap(simulateNetwork(Date.now()));
      setError(null);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), pollMs);
    return () => clearInterval(id);
  }, [load, pollMs]);

  return { snap, error, reload: load };
}
