import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router";
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
import {
  cn,
  formatDuration,
  formatRelativeDay,
  formatTime,
  formatTimeSince,
  getToday,
} from "../lib/utils";
import * as api from "../lib/api";
import { Baby, Milk, Droplets } from "lucide-react";
import { EditFeedModal } from "../components/EditEntryModals";

interface FeedEntry {
  id: number;
  type: string;
  status: string;
  side: string | null;
  started_at: string;
  ended_at: string | null;
  pauses: string;
  duration_seconds: number | null;
  amount_ml: number | null;
  notes: string | null;
}

type Tab = "breast" | "formula" | "expressed";

export default function Feed() {
  const location = useLocation();
  const locationState = location.state as {
    startBreast?: "left" | "right";
    tab?: Tab;
  } | null;

  const [activeTab, setActiveTab] = useState<Tab>(
    locationState?.tab || "breast",
  );
  const [active, setActive] = useState<FeedEntry | null>(null);
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [amountMl, setAmountMl] = useState("");
  const [notes, setNotes] = useState("");
  const [amountType, setAmountType] = useState<"formula" | "expressed">(
    "formula",
  );
  const [editingEntry, setEditingEntry] = useState<FeedEntry | null>(null);
  const { showToast } = useToast();

  const refresh = useCallback(async () => {
    const [activeRes, listRes] = await Promise.all([
      api.getActiveFeed(),
      api.getFeedEntries(),
    ]);
    setActive((activeRes.data?.entry as unknown as FeedEntry) ?? null);
    setEntries(
      (listRes.data?.entries as unknown as unknown as FeedEntry[]) ?? [],
    );
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Handle auto-start breast from quick add
  useEffect(() => {
    if (locationState?.startBreast && !active) {
      handleStartBreast(locationState.startBreast);
      // Clear the state so it doesn't re-trigger
      window.history.replaceState({}, "");
    }
  }, [locationState?.startBreast]);

  const handleStartBreast = async (side: "left" | "right") => {
    const res = await api.startBreastFeed(side);
    if (res.error) {
      showToast("error", res.error);
    } else {
      showToast("success", `Breast feed started (${side})`);
      refresh();
    }
  };

  const handlePause = async () => {
    if (!active) return;
    const res = await api.pauseFeed(active.id);
    if (res.error) showToast("error", res.error);
    else refresh();
  };

  const handleResume = async () => {
    if (!active) return;
    const res = await api.resumeFeed(active.id);
    if (res.error) showToast("error", res.error);
    else refresh();
  };

  const handleStop = async () => {
    if (!active) return;
    const res = await api.stopFeed(active.id);
    if (res.error) showToast("error", res.error);
    else {
      showToast("success", "Breast feed recorded");
      refresh();
    }
  };

  const handleLogAmount = async () => {
    const amount = parseInt(amountMl);
    if (!amount || amount <= 0) {
      showToast("error", "Enter a valid amount");
      return;
    }

    const fn =
      amountType === "formula" ? api.logFormulaFeed : api.logExpressedFeed;
    const res = await fn(amount, notes || undefined);

    if (res.error) {
      showToast("error", res.error);
    } else {
      showToast("success", `${amountType} feed logged (${amount}ml)`);
      setShowAmountModal(false);
      setAmountMl("");
      setNotes("");
      refresh();
    }
  };

  const today = getToday();
  const todayFeeds = entries.filter(
    (e) => e.started_at.slice(0, 10) === today && e.status === "completed",
  );
  const FEED_INTERVAL_TARGET = 4;
  const lastCompleted = todayFeeds[0];
  const hoursSinceLast = lastCompleted
    ? (Date.now() -
        new Date(
          lastCompleted.ended_at || lastCompleted.started_at,
        ).getTime()) /
      3600000
    : null;

  const filteredEntries = entries.filter((e) => {
    if (activeTab === "breast") return e.type === "breast";
    if (activeTab === "formula") return e.type === "formula";
    return e.type === "expressed";
  });

  return (
    <PageContainer>
      <PageHeader title="Feed" subtitle="Track feeding sessions" />

      {/* Today's stats */}
      <Card padding="sm" className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] text-[var(--color-text-secondary)]">
              Today: {todayFeeds.length} feeds
            </p>
          </div>
          <p
            className={cn(
              "text-[14px] font-semibold",
              hoursSinceLast === null
                ? "text-[var(--color-text-tertiary)]"
                : hoursSinceLast <= FEED_INTERVAL_TARGET
                  ? "text-[var(--color-success)]"
                  : hoursSinceLast <= FEED_INTERVAL_TARGET * 1.5
                    ? "text-[var(--color-warning)]"
                    : "text-[var(--color-danger)]",
            )}
          >
            {hoursSinceLast !== null
              ? `Last: ${formatTimeSince(lastCompleted.ended_at || lastCompleted.started_at)}`
              : "No feeds yet"}
          </p>
        </div>
      </Card>

      {/* Active breast feed timer */}
      {active && (
        <Card variant="elevated" padding="lg" className="mb-6">
          <TimerDisplay
            startedAt={active.started_at}
            pauses={JSON.parse(active.pauses)}
            status={active.status as "active" | "paused"}
            label={`Breast feed (${active.side})`}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
          />
        </Card>
      )}

      {/* Tab selector */}
      <div className="flex rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)] p-1 mb-6">
        {(["breast", "expressed", "formula"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 text-[13px] font-semibold rounded-[var(--radius-sm)] transition-all duration-200",
              activeTab === tab
                ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--shadow-sm)]"
                : "text-[var(--color-text-secondary)]",
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Actions per tab */}
      {activeTab === "breast" && !active && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button size="lg" fullWidth onClick={() => handleStartBreast("left")}>
            Left
          </Button>
          <Button
            size="lg"
            fullWidth
            onClick={() => handleStartBreast("right")}
          >
            Right
          </Button>
        </div>
      )}

      {activeTab === "formula" && (
        <Button
          size="lg"
          fullWidth
          className="mb-6"
          onClick={() => {
            setAmountType("formula");
            setShowAmountModal(true);
          }}
        >
          <Milk className="w-5 h-5" />
          Log Formula Feed
        </Button>
      )}

      {activeTab === "expressed" && (
        <Button
          size="lg"
          fullWidth
          className="mb-6"
          onClick={() => {
            setAmountType("expressed");
            setShowAmountModal(true);
          }}
        >
          <Droplets className="w-5 h-5" />
          Log Expressed Feed
        </Button>
      )}

      {/* Recent entries */}
      <h2 className="text-[15px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
        Recent
      </h2>

      {filteredEntries.length === 0 && !isLoading ? (
        <EmptyState
          icon={<Baby className="w-6 h-6" />}
          title={`No ${activeTab} feeds yet`}
        />
      ) : (
        <div className="space-y-2">
          {filteredEntries
            .filter((e) => e.status === "completed")
            .slice(0, 20)
            .map((entry) => (
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
                      {entry.side && (
                        <span className="text-[var(--color-text-secondary)]">
                          {" "}
                          ({entry.side})
                        </span>
                      )}
                    </p>
                    {entry.notes && (
                      <p className="text-[13px] text-[var(--color-text-secondary)] mt-0.5">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                  <span className="text-[15px] font-semibold text-[var(--color-accent)] tabular-nums">
                    {entry.duration_seconds
                      ? formatDuration(entry.duration_seconds)
                      : entry.amount_ml
                        ? `${entry.amount_ml}ml`
                        : "-"}
                  </span>
                </div>
              </Card>
            ))}
        </div>
      )}

      <EditFeedModal
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

      {/* Amount Modal */}
      <Modal
        isOpen={showAmountModal}
        onClose={() => setShowAmountModal(false)}
        title={`Log ${amountType} feed`}
      >
        <div className="space-y-4">
          <Input
            label="Amount (ml)"
            type="number"
            inputMode="numeric"
            value={amountMl}
            onChange={(e) => setAmountMl(e.target.value)}
            placeholder="e.g. 120"
            autoFocus
          />
          <Input
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes..."
          />
          <Button size="lg" fullWidth onClick={handleLogAmount}>
            Log Feed
          </Button>
        </div>
      </Modal>
    </PageContainer>
  );
}
