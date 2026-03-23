import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { PageContainer, PageHeader } from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../components/ui/Toast";
import { FloatingActionButton } from "../components/ui/TabBar";
import { TimerDisplay } from "../components/Timer";
import { useAppDispatch, useAppSelector } from "../store";
import { fetchDashboard } from "../store/slices/dashboardSlice";
import { cn, formatTimeSince, getGreeting } from "../lib/utils";
import * as api from "../lib/api";
import {
  Moon,
  Baby,
  Droplets,
  Milk,
  Heart,
  CloudRain,
  Clock,
  ListChecks,
} from "lucide-react";
import { Link } from "react-router";

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const { activeTimers, lastSleep, lastFeed, lastNappy, today, dailyTasks } =
    useAppSelector((state) => state.dashboard);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const refresh = useCallback(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleQuickNappy = async (type: "wet" | "dirty" | "both") => {
    const response = await api.logNappy(type);
    if (response.error) {
      showToast("error", response.error);
    } else {
      showToast(
        "success",
        `${type.charAt(0).toUpperCase() + type.slice(1)} nappy logged`,
      );
      refresh();
    }
    setShowQuickAdd(false);
  };

  const handleStartSleep = async () => {
    const response = await api.startSleep();
    if (response.error) {
      showToast("error", response.error);
    } else {
      showToast("success", "Sleep timer started");
      refresh();
    }
    setShowQuickAdd(false);
  };

  const handleStartBreast = (side: "left" | "right") => {
    navigate("/feed", { state: { startBreast: side } });
    setShowQuickAdd(false);
  };

  const handleTimerAction = async (
    timerType: string,
    entryId: number,
    action: "pause" | "resume" | "stop",
  ) => {
    let response;
    if (timerType === "sleep") {
      if (action === "pause") response = await api.pauseSleep(entryId);
      else if (action === "resume") response = await api.resumeSleep(entryId);
      else response = await api.stopSleep(entryId);
    } else if (timerType === "feed") {
      if (action === "pause") response = await api.pauseFeed(entryId);
      else if (action === "resume") response = await api.resumeFeed(entryId);
      else response = await api.stopFeed(entryId);
    } else {
      if (action === "pause") response = await api.pausePump(entryId);
      else if (action === "resume") response = await api.resumePump(entryId);
      else response = await api.stopPump(entryId);
    }
    if (response?.error) {
      showToast("error", response.error);
    } else {
      refresh();
    }
  };

  const timerLabel = (type: string, entry: Record<string, unknown>) => {
    if (type === "sleep") return "Sleep";
    if (type === "feed") {
      const side = entry.side as string;
      return `Breast feed (${side})`;
    }
    return "Pump";
  };

  return (
    <PageContainer>
      <PageHeader
        title={getGreeting()}
        subtitle="Baby Tracker"
        action={
          <Link
            to="/history"
            className="flex items-center gap-1.5 text-[var(--color-accent)] text-[14px] font-medium press-effect"
          >
            <Clock className="w-4 h-4" />
            History
          </Link>
        }
      />

      {/* Active Timers */}
      {activeTimers.length > 0 && (
        <div className="space-y-3 mb-6">
          {activeTimers.map((timer) => {
            const entry = timer.entry;
            const entryId = entry.id as number;
            const status = entry.status as "active" | "paused";
            const pauses = JSON.parse((entry.pauses as string) || "[]");

            return (
              <Card
                key={`${timer.type}-${entryId}`}
                variant="elevated"
                padding="lg"
              >
                <TimerDisplay
                  startedAt={entry.started_at as string}
                  pauses={pauses}
                  status={status}
                  label={timerLabel(timer.type, entry)}
                  onPause={() =>
                    handleTimerAction(timer.type, entryId, "pause")
                  }
                  onResume={() =>
                    handleTimerAction(timer.type, entryId, "resume")
                  }
                  onStop={() => handleTimerAction(timer.type, entryId, "stop")}
                />
              </Card>
            );
          })}
        </div>
      )}

      {/* Today's Stats */}
      {today && (
        <div className="grid grid-cols-2 gap-3 mb-6 animate-fade-in">
          <Card padding="sm">
            <div className="flex flex-col items-center text-center py-1">
              <p className="text-[13px] text-[var(--color-text-secondary)] font-medium uppercase tracking-wide">
                Nappies today
              </p>
              <p
                className={cn(
                  "text-[28px] font-bold tabular-nums mt-1",
                  today.nappy_count >= today.nappy_target
                    ? "text-[var(--color-success)]"
                    : today.nappy_count >= today.nappy_target * 0.5
                      ? "text-[var(--color-warning)]"
                      : "text-[var(--color-danger)]",
                )}
              >
                {today.nappy_count}
                <span className="text-[15px] font-normal text-[var(--color-text-tertiary)]">
                  /{today.nappy_target}
                </span>
              </p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="flex flex-col items-center text-center py-1">
              <p className="text-[13px] text-[var(--color-text-secondary)] font-medium uppercase tracking-wide">
                Since last feed
              </p>
              {today.hours_since_last_feed !== null ? (
                <p
                  className={cn(
                    "text-[28px] font-bold tabular-nums mt-1",
                    today.hours_since_last_feed <= today.feed_interval_target
                      ? "text-[var(--color-success)]"
                      : today.hours_since_last_feed <=
                          today.feed_interval_target * 1.5
                        ? "text-[var(--color-warning)]"
                        : "text-[var(--color-danger)]",
                  )}
                >
                  {today.hours_since_last_feed < 1
                    ? `${Math.round(today.hours_since_last_feed * 60)}m`
                    : `${Math.floor(today.hours_since_last_feed)}h ${Math.round((today.hours_since_last_feed % 1) * 60)}m`}
                </p>
              ) : (
                <p className="text-[28px] font-bold text-[var(--color-text-tertiary)] mt-1">
                  --
                </p>
              )}
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                target: every {today.feed_interval_target}h
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Daily Tasks */}
      {dailyTasks && dailyTasks.total_count > 0 && (
        <Card
          className="mb-6 cursor-pointer press-effect hover:shadow-[var(--shadow-md)] transition-shadow animate-fade-in"
          onClick={() => navigate("/daily-tasks")}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
              <ListChecks className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                Daily Tasks
              </p>
              <p className="text-[13px] text-[var(--color-text-secondary)]">
                {dailyTasks.completed_count} of {dailyTasks.due_count} due tasks
                done
              </p>
            </div>
            <p
              className={cn(
                "text-[22px] font-bold tabular-nums",
                dailyTasks.completed_count >= dailyTasks.due_count &&
                  dailyTasks.due_count > 0
                  ? "text-[var(--color-success)]"
                  : dailyTasks.completed_count > 0
                    ? "text-[var(--color-warning)]"
                    : dailyTasks.due_count > 0
                      ? "text-[var(--color-danger)]"
                      : "text-[var(--color-success)]",
              )}
            >
              {dailyTasks.completed_count}/{dailyTasks.due_count}
            </p>
          </div>
        </Card>
      )}

      {/* Time Since Cards */}
      <div className="space-y-3 animate-fade-in">
        <TimeSinceCard
          icon={<Baby className="w-5 h-5" />}
          label="Last Feed"
          entry={lastFeed}
          color="text-[var(--color-accent)]"
          bgColor="bg-[var(--color-accent)]/10"
          onClick={() => navigate("/feed")}
        />
        <TimeSinceCard
          icon={<Moon className="w-5 h-5" />}
          label="Last Sleep"
          entry={lastSleep}
          color="text-[var(--color-purple)]"
          bgColor="bg-[var(--color-purple)]/10"
          onClick={() => navigate("/sleep")}
        />
        <TimeSinceCard
          icon={<CloudRain className="w-5 h-5" />}
          label="Last Nappy"
          entry={lastNappy}
          color="text-[var(--color-success)]"
          bgColor="bg-[var(--color-success)]/10"
          onClick={() => navigate("/nappy")}
        />
      </div>

      <FloatingActionButton onClick={() => setShowQuickAdd(true)} label="Log" />

      {/* Quick Add Sheet */}
      <Modal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        title="Quick Add"
      >
        <div className="grid grid-cols-2 gap-3">
          <QuickAddButton
            icon={<Moon className="w-6 h-6" />}
            label="Sleep"
            color="bg-[var(--color-purple)]/10 text-[var(--color-purple)]"
            onClick={handleStartSleep}
          />
          <QuickAddButton
            icon={<Heart className="w-6 h-6" />}
            label="Breast (L)"
            color="bg-[var(--color-pink)]/10 text-[var(--color-pink)]"
            onClick={() => handleStartBreast("left")}
          />
          <QuickAddButton
            icon={<Heart className="w-6 h-6" />}
            label="Breast (R)"
            color="bg-[var(--color-pink)]/10 text-[var(--color-pink)]"
            onClick={() => handleStartBreast("right")}
          />
          <QuickAddButton
            icon={<Milk className="w-6 h-6" />}
            label="Formula"
            color="bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
            onClick={() => {
              navigate("/feed", { state: { tab: "formula" } });
              setShowQuickAdd(false);
            }}
          />
          <QuickAddButton
            icon={<Droplets className="w-6 h-6" />}
            label="Expressed"
            color="bg-[var(--color-accent-light)]/10 text-[var(--color-accent)]"
            onClick={() => {
              navigate("/feed", { state: { tab: "expressed" } });
              setShowQuickAdd(false);
            }}
          />
          <QuickAddButton
            icon={<CloudRain className="w-6 h-6" />}
            label="Wet Nappy"
            color="bg-[var(--color-success)]/10 text-[var(--color-success)]"
            onClick={() => handleQuickNappy("wet")}
          />
          <QuickAddButton
            icon={<CloudRain className="w-6 h-6" />}
            label="Dirty Nappy"
            color="bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
            onClick={() => handleQuickNappy("dirty")}
          />
          <QuickAddButton
            icon={<CloudRain className="w-6 h-6" />}
            label="Both"
            color="bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
            onClick={() => handleQuickNappy("both")}
          />
        </div>
      </Modal>
    </PageContainer>
  );
}

function TimeSinceCard({
  icon,
  label,
  entry,
  color,
  bgColor,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  entry: Record<string, unknown> | null;
  color: string;
  bgColor: string;
  onClick: () => void;
}) {
  const time = entry
    ? (entry.ended_at as string) ||
      (entry.occurred_at as string) ||
      (entry.started_at as string)
    : null;

  return (
    <Card
      className="cursor-pointer press-effect hover:shadow-[var(--shadow-md)] transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            bgColor,
            color,
          )}
        >
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
            {label}
          </p>
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            {time ? formatTimeSince(time) : "No entries yet"}
          </p>
        </div>
      </div>
    </Card>
  );
}

function QuickAddButton({
  icon,
  label,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2",
        "p-4 rounded-[var(--radius-lg)]",
        color,
        "press-effect",
        "transition-all duration-200",
      )}
    >
      {icon}
      <span className="text-[13px] font-medium">{label}</span>
    </button>
  );
}
