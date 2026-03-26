"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Returns elapsed seconds since `startedAt` was set.
 * Stops ticking when `active` becomes false.
 */
export function useElapsed(active: boolean) {
  const startRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (active && startRef.current === null) {
      startRef.current = Date.now();
    }
    if (!active) {
      startRef.current = null;
      return;
    }

    const id = setInterval(() => {
      if (startRef.current) {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }
    }, 1000);

    return () => clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (!active) setElapsed(0);
  }, [active]);

  return elapsed;
}

export function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}
