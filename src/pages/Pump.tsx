import { useEffect, useState, useCallback } from "react";
import {
  PageContainer,
  PageHeader,
  EmptyState,
} from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../components/ui/Toast";
import { TimerDisplay } from "../components/Timer";
import { formatDuration, formatRelativeDay, formatTime } from "../lib/utils";
import * as api from "../lib/api";
import { Droplets, Play } from "lucide-react";
import { EditPumpModal } from "../components/EditEntryModals";

interface PumpEntry {
  id: number;
  status: string;
  started_at: string;
  ended_at: string | null;
  pauses: string;
  duration_seconds: number | null;
  amount_ml: number | null;
  notes: string | null;
}

export default function Pump() {
  const [active, setActive] = useState<PumpEntry | null>(null);
  const [entries, setEntries] = useState<PumpEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showStopModal, setShowStopModal] = useState(false);
  const [amountMl, setAmountMl] = useState("");
  const [notes, setNotes] = useState("");
  const [editingEntry, setEditingEntry] = useState<PumpEntry | null>(null);
  const { showToast } = useToast();

  const refresh = useCallback(async () => {
    const [activeRes, listRes] = await Promise.all([
      api.getActivePump(),
      api.getPumpEntries(),
    ]);
    setActive((activeRes.data?.entry as unknown as PumpEntry) ?? null);
    setEntries(
      (
        (listRes.data?.entries as unknown as unknown as PumpEntry[]) ?? []
      ).filter((e) => e.status === "completed"),
    );
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleStart = async () => {
    const res = await api.startPump();
    if (res.error) {
      showToast("error", res.error);
    } else {
      showToast("success", "Pump timer started");
      refresh();
    }
  };

  const handlePause = async () => {
    if (!active) return;
    const res = await api.pausePump(active.id);
    if (res.error) showToast("error", res.error);
    else refresh();
  };

  const handleResume = async () => {
    if (!active) return;
    const res = await api.resumePump(active.id);
    if (res.error) showToast("error", res.error);
    else refresh();
  };

  const handleStopClick = () => {
    setShowStopModal(true);
  };

  const handleStopConfirm = async () => {
    if (!active) return;
    const amount = amountMl ? parseInt(amountMl) : undefined;
    const res = await api.stopPump(active.id, amount, notes || undefined);
    if (res.error) {
      showToast("error", res.error);
    } else {
      showToast("success", "Pump session recorded");
      setShowStopModal(false);
      setAmountMl("");
      setNotes("");
      refresh();
    }
  };

  return (
    <PageContainer>
      <PageHeader title="Pump" subtitle="Track expressing sessions" />

      {active ? (
        <Card variant="elevated" padding="lg" className="mb-6">
          <TimerDisplay
            startedAt={active.started_at}
            pauses={JSON.parse(active.pauses)}
            status={active.status as "active" | "paused"}
            label="Pumping"
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStopClick}
          />
        </Card>
      ) : (
        <Button size="lg" fullWidth onClick={handleStart} className="mb-6">
          <Play className="w-5 h-5" />
          Start Pump
        </Button>
      )}

      <h2 className="text-[15px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
        Recent
      </h2>

      {entries.length === 0 && !isLoading ? (
        <EmptyState
          icon={<Droplets className="w-6 h-6" />}
          title="No pump sessions yet"
          description="Start tracking expressing sessions"
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
                <div className="text-right">
                  {entry.amount_ml && (
                    <span className="text-[15px] font-semibold text-[var(--color-accent)] tabular-nums">
                      {entry.amount_ml}ml
                    </span>
                  )}
                  {entry.duration_seconds && (
                    <p className="text-[13px] text-[var(--color-text-secondary)] tabular-nums">
                      {formatDuration(entry.duration_seconds)}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <EditPumpModal
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

      {/* Stop Pump Modal */}
      <Modal
        isOpen={showStopModal}
        onClose={() => setShowStopModal(false)}
        title="End Pump Session"
      >
        <div className="space-y-4">
          <Input
            label="Amount expressed (ml)"
            type="number"
            inputMode="numeric"
            value={amountMl}
            onChange={(e) => setAmountMl(e.target.value)}
            placeholder="e.g. 60"
            autoFocus
          />
          <Input
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes..."
          />
          <Button size="lg" fullWidth onClick={handleStopConfirm}>
            Save Session
          </Button>
        </div>
      </Modal>
    </PageContainer>
  );
}
