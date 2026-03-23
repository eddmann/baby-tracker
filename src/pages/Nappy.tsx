import { useEffect, useState, useCallback } from "react";
import {
  PageContainer,
  PageHeader,
  EmptyState,
} from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { useToast } from "../components/ui/Toast";
import { cn, formatRelativeDay, formatTime, getToday } from "../lib/utils";
import * as api from "../lib/api";
import { CloudRain, Droplets } from "lucide-react";
import { EditNappyModal } from "../components/EditEntryModals";

interface NappyEntry {
  id: number;
  type: string;
  occurred_at: string;
  notes: string | null;
}

export default function Nappy() {
  const [entries, setEntries] = useState<NappyEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<NappyEntry | null>(null);
  const { showToast } = useToast();

  const refresh = useCallback(async () => {
    const res = await api.getNappyEntries();
    setEntries((res.data?.entries as unknown as NappyEntry[]) ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleLog = async (type: "wet" | "dirty" | "both") => {
    const res = await api.logNappy(type);
    if (res.error) {
      showToast("error", res.error);
    } else {
      showToast(
        "success",
        `${type.charAt(0).toUpperCase() + type.slice(1)} nappy logged`,
      );
      refresh();
    }
  };

  const todayCount = entries.filter(
    (e) => e.occurred_at.slice(0, 10) === getToday(),
  ).length;
  const NAPPY_TARGET = 12;

  const typeConfig = {
    wet: {
      color: "text-[var(--color-accent)]",
      bg: "bg-[var(--color-accent)]/10",
      label: "Wet",
    },
    dirty: {
      color: "text-[var(--color-warning)]",
      bg: "bg-[var(--color-warning)]/10",
      label: "Dirty",
    },
    both: {
      color: "text-[var(--color-danger)]",
      bg: "bg-[var(--color-danger)]/10",
      label: "Both",
    },
  };

  return (
    <PageContainer>
      <PageHeader title="Nappy" subtitle="Track nappy changes" />

      {/* Today's count */}
      <Card padding="sm" className="mb-4">
        <div className="flex items-center justify-between">
          <p className="text-[14px] text-[var(--color-text-secondary)]">
            Today
          </p>
          <p
            className={cn(
              "text-[17px] font-bold tabular-nums",
              todayCount >= NAPPY_TARGET
                ? "text-[var(--color-success)]"
                : todayCount >= NAPPY_TARGET * 0.5
                  ? "text-[var(--color-warning)]"
                  : "text-[var(--color-danger)]",
            )}
          >
            {todayCount}
            <span className="text-[14px] font-normal text-[var(--color-text-tertiary)]">
              /{NAPPY_TARGET}
            </span>
          </p>
        </div>
      </Card>

      {/* Quick log buttons */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {(["wet", "dirty", "both"] as const).map((type) => {
          const config = typeConfig[type];
          return (
            <button
              key={type}
              onClick={() => handleLog(type)}
              className={cn(
                "flex flex-col items-center justify-center gap-2",
                "p-5 rounded-[var(--radius-lg)]",
                config.bg,
                config.color,
                "press-effect",
                "transition-all duration-200",
              )}
            >
              <Droplets className="w-7 h-7" />
              <span className="text-[15px] font-semibold">{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Recent entries */}
      <h2 className="text-[15px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
        Recent
      </h2>

      {entries.length === 0 && !isLoading ? (
        <EmptyState
          icon={<CloudRain className="w-6 h-6" />}
          title="No nappy entries yet"
          description="Tap a button above to log a nappy"
        />
      ) : (
        <div className="space-y-2">
          {entries.slice(0, 30).map((entry) => {
            const config = typeConfig[entry.type as keyof typeof typeConfig];
            return (
              <Card
                key={entry.id}
                padding="sm"
                className="cursor-pointer press-effect"
                onClick={() => setEditingEntry(entry)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        config.bg,
                        config.color,
                      )}
                    >
                      <Droplets className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[15px] font-medium text-[var(--color-text-primary)]">
                        {config.label}
                      </p>
                      {entry.notes && (
                        <p className="text-[13px] text-[var(--color-text-secondary)]">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[13px] text-[var(--color-text-secondary)] tabular-nums">
                    {formatRelativeDay(entry.occurred_at) && (
                      <>{formatRelativeDay(entry.occurred_at)} </>
                    )}
                    {formatTime(entry.occurred_at)}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <EditNappyModal
        entry={editingEntry}
        isOpen={!!editingEntry}
        onClose={() => setEditingEntry(null)}
        onSaved={() => {
          setEditingEntry(null);
          refresh();
        }}
        onDeleted={() => {
          setEditingEntry(null);
          refresh();
        }}
      />
    </PageContainer>
  );
}
