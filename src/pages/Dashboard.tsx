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
        subtitle={new Date().toLocaleDateString(undefined, {
          weekday: "short",
          day: "numeric",
          month: "short",
        })}
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 animate-fade-in">
        <Card
          padding="sm"
          className="cursor-pointer press-effect"
          onClick={() => navigate("/feed")}
        >
          <div className="flex flex-col items-center text-center py-1">
            <div className="flex items-center gap-1 mb-1">
              <Baby className="w-4 h-4 text-[var(--color-accent)]" />
              <p className="text-[11px] text-[var(--color-text-secondary)] font-medium uppercase tracking-wide">
                Feeds
              </p>
            </div>
            <p className="text-[28px] font-bold tabular-nums mt-1 text-[var(--color-accent)]">
              {today?.feed_count ?? 0}
            </p>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">
              {lastFeed
                ? `last ${formatTimeSince(lastFeed.started_at as string)}`
                : "none yet"}
            </p>
          </div>
        </Card>
        <Card
          padding="sm"
          className="cursor-pointer press-effect"
          onClick={() => navigate("/sleep")}
        >
          <div className="flex flex-col items-center text-center py-1">
            <div className="flex items-center gap-1 mb-1">
              <Moon className="w-4 h-4 text-[var(--color-purple)]" />
              <p className="text-[11px] text-[var(--color-text-secondary)] font-medium uppercase tracking-wide">
                Sleeps
              </p>
            </div>
            <p className="text-[28px] font-bold tabular-nums mt-1 text-[var(--color-purple)]">
              {today?.sleep_count ?? 0}
            </p>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">
              {lastSleep
                ? `last ${formatTimeSince(lastSleep.started_at as string)}`
                : "none yet"}
            </p>
          </div>
        </Card>
        <Card
          padding="sm"
          className="cursor-pointer press-effect"
          onClick={() => navigate("/nappy")}
        >
          <div className="flex flex-col items-center text-center py-1">
            <div className="flex items-center gap-1 mb-1">
              <CloudRain className="w-4 h-4 text-[var(--color-success)]" />
              <p className="text-[11px] text-[var(--color-text-secondary)] font-medium uppercase tracking-wide">
                Nappies
              </p>
            </div>
            <p
              className={cn(
                "text-[28px] font-bold tabular-nums mt-1",
                today && today.nappy_count >= today.nappy_target
                  ? "text-[var(--color-success)]"
                  : today && today.nappy_count >= today.nappy_target * 0.5
                    ? "text-[var(--color-warning)]"
                    : "text-[var(--color-danger)]",
              )}
            >
              {today?.nappy_count ?? 0}
              <span className="text-[13px] font-normal text-[var(--color-text-tertiary)]">
                /{today?.nappy_target ?? 12}
              </span>
            </p>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">
              {lastNappy
                ? `last ${formatTimeSince(lastNappy.occurred_at as string)}`
                : "none yet"}
            </p>
          </div>
        </Card>
        <Card
          padding="sm"
          className="cursor-pointer press-effect"
          onClick={() => navigate("/daily-tasks")}
        >
          <div className="flex flex-col items-center text-center py-1">
            <div className="flex items-center gap-1 mb-1">
              <ListChecks className="w-4 h-4 text-[var(--color-accent)]" />
              <p className="text-[11px] text-[var(--color-text-secondary)] font-medium uppercase tracking-wide">
                Tasks
              </p>
            </div>
            <p
              className={cn(
                "text-[28px] font-bold tabular-nums mt-1",
                dailyTasks &&
                  dailyTasks.completed_count >= dailyTasks.due_count &&
                  dailyTasks.due_count > 0
                  ? "text-[var(--color-success)]"
                  : dailyTasks && dailyTasks.completed_count > 0
                    ? "text-[var(--color-warning)]"
                    : dailyTasks && dailyTasks.due_count > 0
                      ? "text-[var(--color-danger)]"
                      : "text-[var(--color-text-tertiary)]",
              )}
            >
              {dailyTasks?.completed_count ?? 0}
              <span className="text-[13px] font-normal text-[var(--color-text-tertiary)]">
                /{dailyTasks?.due_count ?? 0}
              </span>
            </p>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">
              due today
            </p>
          </div>
        </Card>
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
