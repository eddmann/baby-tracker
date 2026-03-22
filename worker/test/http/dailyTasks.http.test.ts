import { describe, test, expect } from "bun:test";
import {
  createHttpEnv,
  requestJson,
  authenticateWithPin,
  insertDailyTask,
  insertDailyTaskCompletion,
} from "./helpers";

describe("HTTP /api/daily-tasks", () => {
  test("returns 401 when not authenticated", async () => {
    const env = await createHttpEnv();

    const { res } = await requestJson(env, "/api/daily-tasks");
    expect(res.status).toBe(401);
  });

  test("creates a task", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const { res, body } = await requestJson<{
      data: { task: { name: string; frequency_days: number } };
    }>(env, "/api/daily-tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: "Vitamin D drops", frequency_days: 1 }),
    });

    expect(res.status).toBe(200);
    expect(body.data.task.name).toBe("Vitamin D drops");
    expect(body.data.task.frequency_days).toBe(1);
  });

  test("lists tasks with status", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    await insertDailyTask(env, { name: "Task A" });
    await insertDailyTask(env, { name: "Task B", frequency_days: 3 });

    const { res, body } = await requestJson<{
      data: { tasks: { name: string; is_due: boolean }[] };
    }>(env, "/api/daily-tasks?tz=0", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    expect(body.data.tasks).toHaveLength(2);
  });

  test("edits a task", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const task = await insertDailyTask(env, { name: "Old name" });

    const { res, body } = await requestJson<{
      data: { task: { name: string; frequency_days: number } };
    }>(env, `/api/daily-tasks/${task.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: "New name", frequency_days: 5 }),
    });

    expect(res.status).toBe(200);
    expect(body.data.task.name).toBe("New name");
    expect(body.data.task.frequency_days).toBe(5);
  });

  test("returns 404 for editing non-existent task", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const { res } = await requestJson(env, "/api/daily-tasks/9999", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: "Nope" }),
    });

    expect(res.status).toBe(404);
  });

  test("deletes a task", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const task = await insertDailyTask(env);

    const { res } = await requestJson(env, `/api/daily-tasks/${task.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
  });

  test("completes a task", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const task = await insertDailyTask(env);

    const { res, body } = await requestJson<{
      data: { completion: { task_id: number } };
    }>(env, `/api/daily-tasks/${task.id}/complete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    expect(body.data.completion.task_id).toBe(task.id);
  });

  test("uncompletes a task", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const task = await insertDailyTask(env);
    await insertDailyTaskCompletion(env, {
      task_id: task.id,
      completed_at: new Date().toISOString(),
    });

    const { res } = await requestJson(
      env,
      `/api/daily-tasks/${task.id}/complete?tz=0`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    expect(res.status).toBe(200);
  });

  test("returns 404 for completing non-existent task", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const { res } = await requestJson(env, "/api/daily-tasks/9999/complete", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(404);
  });

  test("newly created task shows is_due true", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    await insertDailyTask(env, { name: "New task" });

    const { body } = await requestJson<{
      data: {
        tasks: { name: string; is_due: boolean; is_completed_today: boolean }[];
      };
    }>(env, "/api/daily-tasks?tz=0", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const task = body.data.tasks.find((t) => t.name === "New task");
    expect(task?.is_due).toBe(true);
    expect(task?.is_completed_today).toBe(false);
  });

  test("completed task shows is_completed_today true", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const task = await insertDailyTask(env);
    await insertDailyTaskCompletion(env, {
      task_id: task.id,
      completed_at: new Date().toISOString(),
    });

    const { body } = await requestJson<{
      data: { tasks: { id: number; is_completed_today: boolean }[] };
    }>(env, "/api/daily-tasks?tz=0", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const found = body.data.tasks.find((t) => t.id === task.id);
    expect(found?.is_completed_today).toBe(true);
  });

  test("task with frequency_days=3 is not due after recent completion", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const task = await insertDailyTask(env, { frequency_days: 3 });
    // Complete it just now
    await insertDailyTaskCompletion(env, {
      task_id: task.id,
      completed_at: new Date().toISOString(),
    });

    const { body } = await requestJson<{
      data: {
        tasks: { id: number; is_due: boolean; next_due_date: string }[];
      };
    }>(env, "/api/daily-tasks?tz=0", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const found = body.data.tasks.find((t) => t.id === task.id);
    // Completed today with frequency 3 — should not be due until 3 days from now
    expect(found?.is_due).toBe(false);
  });
});
