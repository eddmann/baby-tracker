import type { DailyTask, DailyTaskCompletion } from "../../types";

export interface DailyTaskRepository {
  create(name: string, frequencyDays: number, startDate?: string): Promise<DailyTask>;
  getById(id: number): Promise<DailyTask | null>;
  listAll(): Promise<DailyTask[]>;
  update(
    id: number,
    updates: Partial<Pick<DailyTask, "name" | "frequency_days" | "start_date">>,
  ): Promise<void>;
  delete(id: number): Promise<void>;

  addCompletion(taskId: number): Promise<DailyTaskCompletion>;
  removeCompletionForDate(
    taskId: number,
    dayStart: string,
    dayEnd: string,
  ): Promise<void>;
  getLastCompletionPerTask(): Promise<
    { task_id: number; last_completed_at: string }[]
  >;
  getCompletionsForDateRange(
    start: string,
    end: string,
  ): Promise<DailyTaskCompletion[]>;
}
