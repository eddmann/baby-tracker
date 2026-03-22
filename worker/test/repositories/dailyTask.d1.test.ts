import { describe, test, beforeEach, expect } from "bun:test";
import { createTestD1Env, clearD1Tables } from "../d1-setup";
import { createD1DailyTaskRepository } from "../../repositories/d1/dailyTask.d1";

describe("D1 DailyTaskRepository", () => {
  let env: Awaited<ReturnType<typeof createTestD1Env>>;

  beforeEach(async () => {
    env = await createTestD1Env();
    await clearD1Tables(env);
  });

  test("creates a daily task with defaults", async () => {
    const repo = createD1DailyTaskRepository(env);
    const task = await repo.create("Vitamin D drops", 1);

    expect(task.id).toBeGreaterThan(0);
    expect(task.name).toBe("Vitamin D drops");
    expect(task.frequency_days).toBe(1);
  });

  test("creates a task with custom frequency", async () => {
    const repo = createD1DailyTaskRepository(env);
    const task = await repo.create("Wash baby", 3);

    expect(task.frequency_days).toBe(3);
  });

  test("fetches by id", async () => {
    const repo = createD1DailyTaskRepository(env);
    const created = await repo.create("Test task", 1);

    const fetched = await repo.getById(created.id);
    expect(fetched?.id).toBe(created.id);
    expect(fetched?.name).toBe("Test task");
  });

  test("returns null for non-existent id", async () => {
    const repo = createD1DailyTaskRepository(env);
    const fetched = await repo.getById(999);
    expect(fetched).toBeNull();
  });

  test("lists all tasks ordered by created_at", async () => {
    const repo = createD1DailyTaskRepository(env);
    await repo.create("Task A", 1);
    await repo.create("Task B", 2);
    await repo.create("Task C", 3);

    const tasks = await repo.listAll();
    expect(tasks).toHaveLength(3);
    expect(tasks[0].name).toBe("Task A");
    expect(tasks[2].name).toBe("Task C");
  });

  test("updates task name", async () => {
    const repo = createD1DailyTaskRepository(env);
    const task = await repo.create("Old name", 1);

    await repo.update(task.id, { name: "New name" });
    const updated = await repo.getById(task.id);
    expect(updated?.name).toBe("New name");
    expect(updated?.frequency_days).toBe(1);
  });

  test("updates task frequency", async () => {
    const repo = createD1DailyTaskRepository(env);
    const task = await repo.create("Test", 1);

    await repo.update(task.id, { frequency_days: 7 });
    const updated = await repo.getById(task.id);
    expect(updated?.frequency_days).toBe(7);
  });

  test("deletes a task", async () => {
    const repo = createD1DailyTaskRepository(env);
    const task = await repo.create("To delete", 1);

    await repo.delete(task.id);
    const fetched = await repo.getById(task.id);
    expect(fetched).toBeNull();
  });

  test("adds a completion", async () => {
    const repo = createD1DailyTaskRepository(env);
    const task = await repo.create("Test", 1);

    const completion = await repo.addCompletion(task.id);
    expect(completion.id).toBeGreaterThan(0);
    expect(completion.task_id).toBe(task.id);
  });

  test("removes completion for date range", async () => {
    const repo = createD1DailyTaskRepository(env);
    const task = await repo.create("Test", 1);

    await repo.addCompletion(task.id);

    // Remove completions for a wide range covering now
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    await repo.removeCompletionForDate(task.id, yesterday, tomorrow);

    const completions = await repo.getCompletionsForDateRange(
      yesterday,
      tomorrow,
    );
    expect(completions).toHaveLength(0);
  });

  test("cascade deletes completions when task deleted", async () => {
    const repo = createD1DailyTaskRepository(env);
    const task = await repo.create("Test", 1);
    await repo.addCompletion(task.id);

    await repo.delete(task.id);

    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    const completions = await repo.getCompletionsForDateRange(
      yesterday,
      tomorrow,
    );
    expect(completions).toHaveLength(0);
  });

  test("getLastCompletionPerTask returns correct data", async () => {
    const repo = createD1DailyTaskRepository(env);
    const task1 = await repo.create("Task 1", 1);
    const task2 = await repo.create("Task 2", 1);

    await repo.addCompletion(task1.id);
    await repo.addCompletion(task2.id);

    const results = await repo.getLastCompletionPerTask();
    expect(results).toHaveLength(2);

    const task1Result = results.find((r) => r.task_id === task1.id);
    expect(task1Result).toBeDefined();
    expect(task1Result?.last_completed_at).toBeDefined();
  });

  test("getCompletionsForDateRange filters correctly", async () => {
    const repo = createD1DailyTaskRepository(env);
    const task = await repo.create("Test", 1);

    await repo.addCompletion(task.id);

    // Range that includes now
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    const inRange = await repo.getCompletionsForDateRange(yesterday, tomorrow);
    expect(inRange).toHaveLength(1);

    // Range in the past
    const farPast = "2020-01-01T00:00:00.000Z";
    const pastEnd = "2020-01-02T00:00:00.000Z";
    const outOfRange = await repo.getCompletionsForDateRange(farPast, pastEnd);
    expect(outOfRange).toHaveLength(0);
  });
});
