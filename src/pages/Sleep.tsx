import { useEffect, useState, useCallback } from "react";
import {
  PageContainer,
  PageHeader,
  EmptyState,
} from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";
import { TimerDisplay } from "../components/Timer";
import { formatDuration, formatRelativeDay, formatTime } from "../lib/utils";
import * as api from "../lib/api";
import { Moon, Play } from "lucide-react";
import { EditSleepModal } from "../components/EditEntryModals";

interface SleepEntry {
  id: number;
  status: string;
  started_at: string;
  ended_at: string | null;
  pauses: string;
  duration_seconds: number | null;
  notes: string | null;
}

export default function Sleep() {
  const [active, setActive] = useState<SleepEntry | null>(null);
  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<SleepEntry | null>(null);
  const { showToast } = useToast();

  const refresh = useCallback(async () => {
    const [activeRes, listRes] = await Promise.all([
      api.getActiveSleep(),
      api.getSleepEntries(),
    ]);
    setActive((activeRes.data?.entry as unknown as SleepEntry) ?? null);
    setEntries(
      (
        (listRes.data?.entries as unknown as unknown as SleepEntry[]) ?? []
      ).filter((e) => e.status === "completed"),
    );
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleStart = async () => {
    const res = await api.startSleep();
    if (res.error) {
      showToast("error", res.error);
    } else {
      showToast("success", "Sleep timer started");
      refresh();
    }
  };

  const handlePause = async () => {
    if (!active) return;
    const res = await api.pauseSleep(active.id);
    if (res.error) showToast("error", res.error);
    else refresh();
  };

  const handleResume = async () => {
    if (!active) return;
    const res = await api.resumeSleep(active.id);
    if (res.error) showToast("error", res.error);
    else refresh();
  };

  const handleStop = async () => {
    if (!active) return;
    const res = await api.stopSleep(active.id);
    if (res.error) showToast("error", res.error);
    else {
      showToast("success", "Sleep recorded");
      refresh();
    }
  };

  return (
    <PageContainer>
      <PageHeader title="Sleep" subtitle="Track sleep sessions" />

      {/* Active Timer or Start Button */}
      {active ? (
        <Card variant="elevated" padding="lg" className="mb-6">
          <TimerDisplay
            startedAt={active.started_at}
            pauses={JSON.parse(active.pauses)}
            status={active.status as "active" | "paused"}
            label="Sleeping"
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
          />
        </Card>
      ) : (
        <Button size="lg" fullWidth onClick={handleStart} className="mb-6">
          <Play className="w-5 h-5" />
          Start Sleep
        </Button>
      )}

      {/* Recent Entries */}
      <h2 className="text-[15px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
        Recent
      </h2>

      {entries.length === 0 && !isLoading ? (
        <EmptyState
          icon={<Moon className="w-6 h-6" />}
          title="No sleep entries yet"
          description="Start tracking sleep to see history"
        />
      ) : (
        <div className="space-y-2">
          {entries.slice(0, 20).map((entry) => (
            <Card
              key={entry.id}
              padding="sm"
              className="cursor-pointer press-effect"
              onClick={() => setEditingEntry(entry)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-medium text-[var(--color-text-primary)]">
                    {formatRelativeDay(entry.started_at) && (
                      <span className="text-[var(--color-text-secondary)]">
                        {formatRelativeDay(entry.started_at)}{" "}
                      </span>
                    )}
                    {formatTime(entry.started_at)}
                    {entry.ended_at && ` - ${formatTime(entry.ended_at)}`}
                  </p>
                  {entry.notes && (
                    <p className="text-[13px] text-[var(--color-text-secondary)] mt-0.5">
                      {entry.notes}
                    </p>
                  )}
                </div>
                <span className="text-[15px] font-semibold text-[var(--color-purple)] tabular-nums">
                  {entry.duration_seconds
                    ? formatDuration(entry.duration_seconds)
                    : "-"}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
      <EditSleepModal
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
