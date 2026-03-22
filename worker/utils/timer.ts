import type { Pause } from "../types";

export function calculateElapsedSeconds(
  startedAt: string,
  pauses: Pause[],
  endedAt?: string,
): number {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();

  let totalPausedMs = 0;
  for (const pause of pauses) {
    const pauseStart = new Date(pause.paused_at).getTime();
    const pauseEnd = pause.resumed_at
      ? new Date(pause.resumed_at).getTime()
      : end;
    totalPausedMs += pauseEnd - pauseStart;
  }

  return Math.max(0, Math.floor((end - start - totalPausedMs) / 1000));
}
