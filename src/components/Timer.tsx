import { useState, useEffect } from "react";
import { cn, formatTimerDisplay } from "../lib/utils";
import { Pause, Play, Square } from "lucide-react";

interface Pause_ {
  paused_at: string;
  resumed_at: string | null;
}

interface TimerDisplayProps {
  startedAt: string;
  pauses: Pause_[];
  status: "active" | "paused" | "completed";
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  size?: "sm" | "lg";
  label?: string;
  className?: string;
}

function calculateElapsed(
  startedAt: string,
  pauses: Pause_[],
): number {
  const start = new Date(startedAt).getTime();
  const now = Date.now();

  let totalPausedMs = 0;
  for (const pause of pauses) {
    const pauseStart = new Date(pause.paused_at).getTime();
    const pauseEnd = pause.resumed_at
      ? new Date(pause.resumed_at).getTime()
      : now;
    totalPausedMs += pauseEnd - pauseStart;
  }

  return Math.max(0, Math.floor((now - start - totalPausedMs) / 1000));
}

export function TimerDisplay({
  startedAt,
  pauses,
  status,
  onPause,
  onResume,
  onStop,
  size = "lg",
  label,
  className,
}: TimerDisplayProps) {
  const [elapsed, setElapsed] = useState(() =>
    calculateElapsed(startedAt, pauses),
  );

  useEffect(() => {
    if (status === "completed") return;

    const tick = () => {
      setElapsed(calculateElapsed(startedAt, pauses));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt, pauses, status]);

  const isLarge = size === "lg";

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {label && (
        <p className="text-[13px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
          {label}
        </p>
      )}
      <div
        className={cn(
          "tabular-nums font-bold text-[var(--color-text-primary)]",
          isLarge ? "text-[48px]" : "text-[24px]",
        )}
      >
        {formatTimerDisplay(elapsed)}
      </div>
      {status !== "completed" && (onPause || onResume || onStop) && (
        <div className="flex items-center gap-3">
          {status === "active" && onPause && (
            <button
              onClick={onPause}
              className={cn(
                "flex items-center justify-center",
                "w-14 h-14 rounded-full",
                "bg-[var(--color-warning)] text-white",
                "shadow-lg shadow-[var(--color-warning)]/30",
                "press-effect",
              )}
            >
              <Pause className="w-6 h-6" />
            </button>
          )}
          {status === "paused" && onResume && (
            <button
              onClick={onResume}
              className={cn(
                "flex items-center justify-center",
                "w-14 h-14 rounded-full",
                "bg-[var(--color-success)] text-white",
                "shadow-lg shadow-[var(--color-success)]/30",
                "press-effect",
              )}
            >
              <Play className="w-6 h-6" />
            </button>
          )}
          {onStop && (
            <button
              onClick={onStop}
              className={cn(
                "flex items-center justify-center",
                "w-14 h-14 rounded-full",
                "bg-[var(--color-danger)] text-white",
                "shadow-lg shadow-[var(--color-danger)]/30",
                "press-effect",
              )}
            >
              <Square className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
      {status === "paused" && (
        <p className="text-[13px] text-[var(--color-warning)] font-medium">
          Paused
        </p>
      )}
    </div>
  );
}

export default TimerDisplay;
