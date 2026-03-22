import { useEffect, useState, useCallback } from "react";
import {
  PageContainer,
  PageHeader,
  EmptyState,
} from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { cn, formatTime, formatDate, formatDuration, getToday } from "../lib/utils";
import * as api from "../lib/api";
import {
  Moon,
  Baby,
  Droplets,
  CloudRain,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import {
  EditSleepModal,
  EditFeedModal,
  EditNappyModal,
  EditPumpModal,
} from "../components/EditEntryModals";

interface TimelineEvent {
  type: "sleep" | "feed" | "nappy" | "pump";
  time: string;
  entry: Record<string, unknown>;
}

export default function History() {
  const [date, setDate] = useState(getToday());
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const res = await api.getHistory(date);
    setEvents((res.data?.events as unknown as TimelineEvent[]) ?? []);
    setIsLoading(false);
  }, [date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const changeDate = (delta: number) => {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + delta);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setDate(`${y}-${m}-${day}`);
  };

  const isToday = date === getToday();

  const eventConfig = {
    sleep: {
      icon: <Moon className="w-4 h-4" />,
      color: "text-[var(--color-purple)]",
      bg: "bg-[var(--color-purple)]/10",
      label: "Sleep",
    },
    feed: {
      icon: <Baby className="w-4 h-4" />,
      color: "text-[var(--color-accent)]",
      bg: "bg-[var(--color-accent)]/10",
      label: "Feed",
    },
    nappy: {
      icon: <CloudRain className="w-4 h-4" />,
      color: "text-[var(--color-success)]",
      bg: "bg-[var(--color-success)]/10",
      label: "Nappy",
    },
    pump: {
      icon: <Droplets className="w-4 h-4" />,
      color: "text-[var(--color-warning)]",
      bg: "bg-[var(--color-warning)]/10",
      label: "Pump",
    },
  };

  const getEventDetail = (event: TimelineEvent): string => {
    const e = event.entry;
    if (event.type === "sleep") {
      const dur = e.duration_seconds as number | null;
      return dur ? formatDuration(dur) : (e.status as string) || "";
    }
    if (event.type === "feed") {
      const feedType = e.type as string;
      if (feedType === "breast") {
        const side = e.side as string;
        const dur = e.duration_seconds as number | null;
        return `Breast (${side})${dur ? ` - ${formatDuration(dur)}` : ""}`;
      }
      const ml = e.amount_ml as number | null;
      return `${feedType.charAt(0).toUpperCase() + feedType.slice(1)}${ml ? ` - ${ml}ml` : ""}`;
    }
    if (event.type === "nappy") {
      const nappyType = e.type as string;
      return nappyType.charAt(0).toUpperCase() + nappyType.slice(1);
    }
    if (event.type === "pump") {
      const ml = e.amount_ml as number | null;
      const dur = e.duration_seconds as number | null;
      const parts = [];
      if (ml) parts.push(`${ml}ml`);
      if (dur) parts.push(formatDuration(dur));
      return parts.join(" - ") || (e.status as string) || "";
    }
    return "";
  };

  return (
    <PageContainer>
      <PageHeader title="History" />

      {/* Date Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => changeDate(-1)}
          className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-secondary)] press-effect"
        >
          <ChevronLeft className="w-5 h-5 text-[var(--color-text-secondary)]" />
        </button>
        <div className="text-center">
          <p className="text-[17px] font-semibold text-[var(--color-text-primary)]">
            {isToday ? "Today" : formatDate(date)}
          </p>
          {!isToday && (
            <p className="text-[13px] text-[var(--color-text-secondary)]">
              {date}
            </p>
          )}
        </div>
        <button
          onClick={() => changeDate(1)}
          disabled={isToday}
          className={cn(
            "p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-secondary)] press-effect",
            isToday && "opacity-30 pointer-events-none",
          )}
        >
          <ChevronRight className="w-5 h-5 text-[var(--color-text-secondary)]" />
        </button>
      </div>

      {/* Timeline */}
      {events.length === 0 && !isLoading ? (
        <EmptyState
          icon={<Clock className="w-6 h-6" />}
          title="No events"
          description="Nothing recorded for this day"
        />
      ) : (
        <div className="space-y-2">
          {events.map((event, idx) => {
            const config = eventConfig[event.type];
            return (
              <Card key={idx} padding="sm" className="cursor-pointer press-effect" onClick={() => setEditingEvent(event)}>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      config.bg,
                      config.color,
                    )}
                  >
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-[var(--color-text-primary)]">
                      {config.label}
                    </p>
                    <p className="text-[13px] text-[var(--color-text-secondary)] truncate">
                      {getEventDetail(event)}
                    </p>
                  </div>
                  <span className="text-[13px] text-[var(--color-text-secondary)] tabular-nums flex-shrink-0">
                    {formatTime(event.time)}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {editingEvent?.type === "sleep" && (
        <EditSleepModal
          entry={editingEvent.entry as any}
          isOpen
          onClose={() => setEditingEvent(null)}
          onSaved={() => { setEditingEvent(null); refresh(); }}
          onDeleted={() => { setEditingEvent(null); refresh(); }}
        />
      )}
      {editingEvent?.type === "feed" && (
        <EditFeedModal
          entry={editingEvent.entry as any}
          isOpen
          onClose={() => setEditingEvent(null)}
          onSaved={() => { setEditingEvent(null); refresh(); }}
          onDeleted={() => { setEditingEvent(null); refresh(); }}
        />
      )}
      {editingEvent?.type === "nappy" && (
        <EditNappyModal
          entry={editingEvent.entry as any}
          isOpen
          onClose={() => setEditingEvent(null)}
          onSaved={() => { setEditingEvent(null); refresh(); }}
          onDeleted={() => { setEditingEvent(null); refresh(); }}
        />
      )}
      {editingEvent?.type === "pump" && (
        <EditPumpModal
          entry={editingEvent.entry as any}
          isOpen
          onClose={() => setEditingEvent(null)}
          onSaved={() => { setEditingEvent(null); refresh(); }}
          onDeleted={() => { setEditingEvent(null); refresh(); }}
        />
      )}
    </PageContainer>
  );
}
