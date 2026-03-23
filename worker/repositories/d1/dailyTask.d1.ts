import type { Env, DailyTask, DailyTaskCompletion } from "../../types";
import type { DailyTaskRepository } from "../interfaces/dailyTask.repository";

export function createD1DailyTaskRepository(env: Env): DailyTaskRepository {
  return {
    async create(
      name: string,
      frequencyDays: number,
      startDate?: string,
    ): Promise<DailyTask> {
      const now = new Date().toISOString();
      const row = await env.DB.prepare(
        "INSERT INTO daily_tasks (name, frequency_days, start_date, created_at) VALUES (?, ?, ?, ?) RETURNING *",
      )
        .bind(name, frequencyDays, startDate ?? null, now)
        .first<DailyTask>();
      return row!;
    },

    async getById(id: number): Promise<DailyTask | null> {
      const row = await env.DB.prepare("SELECT * FROM daily_tasks WHERE id = ?")
        .bind(id)
        .first<DailyTask>();
      return row ?? null;
    },

    async listAll(): Promise<DailyTask[]> {
      const { results } = await env.DB.prepare(
        "SELECT * FROM daily_tasks ORDER BY created_at ASC",
      ).all<DailyTask>();
      return results;
    },

    async update(
      id: number,
      updates: Partial<
        Pick<DailyTask, "name" | "frequency_days" | "start_date">
      >,
    ): Promise<void> {
      const fields: string[] = [];
      const values: unknown[] = [];

      if (updates.name !== undefined) {
        fields.push("name = ?");
        values.push(updates.name);
      }
      if (updates.frequency_days !== undefined) {
        fields.push("frequency_days = ?");
        values.push(updates.frequency_days);
      }
      if (updates.start_date !== undefined) {
        fields.push("start_date = ?");
        values.push(updates.start_date);
      }

      if (fields.length === 0) return;

      values.push(id);
      await env.DB.prepare(
        `UPDATE daily_tasks SET ${fields.join(", ")} WHERE id = ?`,
      )
        .bind(...values)
        .run();
    },

    async delete(id: number): Promise<void> {
      await env.DB.prepare("DELETE FROM daily_tasks WHERE id = ?")
        .bind(id)
        .run();
    },

    async addCompletion(taskId: number): Promise<DailyTaskCompletion> {
      const now = new Date().toISOString();
      const row = await env.DB.prepare(
        "INSERT INTO daily_task_completions (task_id, completed_at, created_at) VALUES (?, ?, ?) RETURNING *",
      )
        .bind(taskId, now, now)
        .first<DailyTaskCompletion>();
      return row!;
    },

    async removeCompletionForDate(
      taskId: number,
      dayStart: string,
      dayEnd: string,
    ): Promise<void> {
      await env.DB.prepare(
        "DELETE FROM daily_task_completions WHERE task_id = ? AND completed_at >= ? AND completed_at < ?",
      )
        .bind(taskId, dayStart, dayEnd)
        .run();
    },

    async getLastCompletionPerTask(): Promise<
      { task_id: number; last_completed_at: string }[]
    > {
      const { results } = await env.DB.prepare(
        "SELECT task_id, MAX(completed_at) as last_completed_at FROM daily_task_completions GROUP BY task_id",
      ).all<{ task_id: number; last_completed_at: string }>();
      return results;
    },

    async getCompletionsForDateRange(
      start: string,
      end: string,
    ): Promise<DailyTaskCompletion[]> {
      const { results } = await env.DB.prepare(
        "SELECT * FROM daily_task_completions WHERE completed_at >= ? AND completed_at < ?",
      )
        .bind(start, end)
        .all<DailyTaskCompletion>();
      return results;
    },
  };
}
