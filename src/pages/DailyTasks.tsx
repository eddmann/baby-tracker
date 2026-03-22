import { useEffect, useState, useCallback, useRef } from "react";
import {
  PageContainer,
  PageHeader,
  EmptyState,
} from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";
import { formatFrequency } from "../lib/utils";
import * as api from "../lib/api";
import { ListChecks, Plus, Circle, CheckCircle2 } from "lucide-react";

interface TaskWithStatus {
  id: number;
  name: string;
  frequency_days: number;
  start_date: string | null;
  is_due: boolean;
  is_completed_today: boolean;
  last_completed_at: string | null;
  next_due_date: string | null;
}

function DeleteButton({ onDelete }: { onDelete: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleClick = async () => {
    if (!confirming) {
      setConfirming(true);
      timerRef.current = setTimeout(() => setConfirming(false), 3000);
      return;
    }
    clearTimeout(timerRef.current);
    await onDelete();
  };

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <Button variant="danger" fullWidth onClick={handleClick}>
      {confirming ? "Tap again to confirm delete" : "Delete"}
    </Button>
  );
}

function daysUntilDue(nextDueDate: string | null): string {
  if (!nextDueDate) return "";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(nextDueDate + "T00:00:00");
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diff <= 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return `Due in ${diff} days`;
}

export default function DailyTasks() {
  const [tasks, setTasks] = useState<TaskWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithStatus | null>(null);
  const { showToast } = useToast();

  const refresh = useCallback(async () => {
    const res = await api.getDailyTasks();
    setTasks((res.data?.tasks as unknown as TaskWithStatus[]) ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleToggleComplete = async (task: TaskWithStatus) => {
    if (task.is_completed_today) {
      const res = await api.uncompleteDailyTask(task.id);
      if (res.error) {
        showToast("error", res.error);
      } else {
        refresh();
      }
    } else {
      const res = await api.completeDailyTask(task.id);
      if (res.error) {
        showToast("error", res.error);
      } else {
        refresh();
      }
    }
  };

  const dueTasks = tasks.filter((t) => t.is_due && !t.is_completed_today);
  const completedTasks = tasks.filter((t) => t.is_completed_today);
  const upcomingTasks = tasks.filter((t) => !t.is_due && !t.is_completed_today);

  return (
    <PageContainer>
      <PageHeader
        title="Daily Tasks"
        subtitle="Recurring to-dos"
        action={
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 text-[var(--color-accent)] text-[14px] font-medium press-effect"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        }
      />

      {tasks.length === 0 && !isLoading ? (
        <EmptyState
          icon={<ListChecks className="w-6 h-6" />}
          title="No tasks yet"
          description="Tap Add to create your first recurring task"
        />
      ) : (
        <>
          {/* Due tasks */}
          {dueTasks.length > 0 && (
            <div className="mb-5">
              <h2 className="text-[15px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
                Due today
              </h2>
              <div className="space-y-2">
                {dueTasks.map((task) => (
                  <Card key={task.id} padding="sm" className="press-effect">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleComplete(task)}
                        className="text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors shrink-0"
                      >
                        <Circle className="w-6 h-6" />
                      </button>
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => setEditingTask(task)}
                      >
                        <p className="text-[15px] font-medium text-[var(--color-text-primary)] truncate">
                          {task.name}
                        </p>
                        <p className="text-[13px] text-[var(--color-text-tertiary)]">
                          {formatFrequency(task.frequency_days)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed tasks */}
          {completedTasks.length > 0 && (
            <div className="mb-5">
              <h2 className="text-[15px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
                Done
              </h2>
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <Card key={task.id} padding="sm" className="press-effect opacity-75">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleComplete(task)}
                        className="text-[var(--color-success)] shrink-0"
                      >
                        <CheckCircle2 className="w-6 h-6" />
                      </button>
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => setEditingTask(task)}
                      >
                        <p className="text-[15px] font-medium text-[var(--color-text-secondary)] line-through truncate">
                          {task.name}
                        </p>
                        <p className="text-[13px] text-[var(--color-text-tertiary)]">
                          {formatFrequency(task.frequency_days)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming tasks */}
          {upcomingTasks.length > 0 && (
            <div className="mb-5">
              <h2 className="text-[15px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
                Upcoming
              </h2>
              <div className="space-y-2">
                {upcomingTasks.map((task) => (
                  <Card key={task.id} padding="sm" className="press-effect opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="text-[var(--color-text-tertiary)] shrink-0">
                        <Circle className="w-6 h-6" />
                      </div>
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => setEditingTask(task)}
                      >
                        <p className="text-[15px] font-medium text-[var(--color-text-tertiary)] truncate">
                          {task.name}
                        </p>
                        <p className="text-[13px] text-[var(--color-text-tertiary)]">
                          {formatFrequency(task.frequency_days)} &middot; {daysUntilDue(task.next_due_date)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Modal */}
      <AddTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSaved={() => {
          setShowAddModal(false);
          refresh();
        }}
      />

      {/* Edit Modal */}
      <EditTaskModal
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSaved={() => {
          setEditingTask(null);
          refresh();
        }}
        onDeleted={() => {
          setEditingTask(null);
          refresh();
        }}
      />
    </PageContainer>
  );
}

function AddTaskModal({
  isOpen,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("1");
  const [startDate, setStartDate] = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setName("");
      setFrequency("1");
      setStartDate("");
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!name.trim()) return;
    const freq = parseInt(frequency) || 1;
    setSaving(true);
    const res = await api.createDailyTask(name.trim(), freq, startDate || undefined);
    setSaving(false);
    if (res.error) {
      showToast("error", res.error);
    } else {
      showToast("success", "Task created");
      onSaved();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Task">
      <div className="space-y-4">
        <Input
          label="Task name"
          placeholder="e.g. Vitamin D drops"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <Input
          label="Frequency (days)"
          type="number"
          min="1"
          max="365"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          hint={formatFrequency(parseInt(frequency) || 1)}
        />
        <Input
          label="Start date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          hint="Leave empty to start today"
        />
        <Button
          fullWidth
          onClick={handleSave}
          isLoading={saving}
          disabled={!name.trim()}
        >
          Add Task
        </Button>
      </div>
    </Modal>
  );
}

function EditTaskModal({
  task,
  isOpen,
  onClose,
  onSaved,
  onDeleted,
}: {
  task: TaskWithStatus | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("1");
  const [startDate, setStartDate] = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (task) {
      setName(task.name);
      setFrequency(String(task.frequency_days));
      setStartDate(task.start_date ?? "");
    }
  }, [task]);

  const handleSave = async () => {
    if (!task || !name.trim()) return;
    const freq = parseInt(frequency) || 1;
    setSaving(true);
    const res = await api.updateDailyTask(task.id, {
      name: name.trim(),
      frequency_days: freq,
      start_date: startDate || null,
    });
    setSaving(false);
    if (res.error) {
      showToast("error", res.error);
    } else {
      showToast("success", "Task updated");
      onSaved();
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    const res = await api.deleteDailyTask(task.id);
    if (res.error) {
      showToast("error", res.error);
    } else {
      showToast("success", "Task deleted");
      onDeleted();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Task">
      <div className="space-y-4">
        <Input
          label="Task name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Frequency (days)"
          type="number"
          min="1"
          max="365"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          hint={formatFrequency(parseInt(frequency) || 1)}
        />
        <Input
          label="Start date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          hint="Leave empty to start today"
        />
        <Button
          fullWidth
          onClick={handleSave}
          isLoading={saving}
          disabled={!name.trim()}
        >
          Save
        </Button>
        <DeleteButton onDelete={handleDelete} />
      </div>
    </Modal>
  );
}
