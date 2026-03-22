import type { DailyTask, DailyTaskCompletion } from "../../types";

let taskIdCounter = 1;
let completionIdCounter = 1;

const DEFAULT_NOW = "2026-01-01T00:00:00Z";

function nextTaskIdWithOverride(overrideId?: number): number {
  if (overrideId !== undefined) {
    if (overrideId >= taskIdCounter) {
      taskIdCounter = overrideId + 1;
    }
    return overrideId;
  }
  return taskIdCounter++;
}

function nextCompletionIdWithOverride(overrideId?: number): number {
  if (overrideId !== undefined) {
    if (overrideId >= completionIdCounter) {
      completionIdCounter = overrideId + 1;
    }
    return overrideId;
  }
  return completionIdCounter++;
}

export function createDailyTask(
  overrides: Partial<DailyTask> = {},
): DailyTask {
  const id = nextTaskIdWithOverride(overrides.id);
  return {
    id,
    name: overrides.name ?? "Test task",
    frequency_days: overrides.frequency_days ?? 1,
    start_date: overrides.start_date ?? null,
    created_at: overrides.created_at ?? DEFAULT_NOW,
    ...overrides,
  };
}

export function createDailyTaskCompletion(
  overrides: Partial<DailyTaskCompletion> = {},
): DailyTaskCompletion {
  const id = nextCompletionIdWithOverride(overrides.id);
  return {
    id,
    task_id: overrides.task_id ?? 1,
    completed_at: overrides.completed_at ?? DEFAULT_NOW,
    created_at: overrides.created_at ?? DEFAULT_NOW,
    ...overrides,
  };
}

export function resetDailyTaskIdCounter(): void {
  taskIdCounter = 1;
}

export function resetDailyTaskCompletionIdCounter(): void {
  completionIdCounter = 1;
}
