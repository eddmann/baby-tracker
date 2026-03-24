import { http, HttpResponse } from "msw";
import {
  createDashboardData,
  createSleepEntry,
  createFeedEntry,
  createNappyEntry,
  createPumpEntry,
  createDailyTask,
} from "../fixtures";
import { TEST_BASE_URL } from "../global-setup";

const BASE_URL = TEST_BASE_URL;

export const handlers = [
  // Auth
  http.post(`${BASE_URL}/api/auth/verify`, async ({ request }) => {
    const body = (await request.json()) as { pin: string };
    if (body.pin === "0000") {
      return HttpResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }
    return HttpResponse.json({ data: { token: "test-token" } });
  }),

  http.get(`${BASE_URL}/api/auth/check`, () => {
    return HttpResponse.json({ data: { valid: true } });
  }),

  // Dashboard
  http.get(`${BASE_URL}/api/dashboard`, () => {
    return HttpResponse.json({ data: createDashboardData() });
  }),

  // Sleep
  http.get(`${BASE_URL}/api/sleep`, () => {
    return HttpResponse.json({
      data: { entries: [createSleepEntry()] },
    });
  }),

  http.get(`${BASE_URL}/api/sleep/active`, () => {
    return HttpResponse.json({ data: { entry: null } });
  }),

  http.post(`${BASE_URL}/api/sleep/start`, () => {
    const entry = createSleepEntry({ status: "active", ended_at: null });
    return HttpResponse.json({ data: { entry } });
  }),

  http.post(`${BASE_URL}/api/sleep/:id/pause`, () => {
    const entry = createSleepEntry({ status: "paused" });
    return HttpResponse.json({ data: { entry } });
  }),

  http.post(`${BASE_URL}/api/sleep/:id/resume`, () => {
    const entry = createSleepEntry({ status: "active" });
    return HttpResponse.json({ data: { entry } });
  }),

  http.post(`${BASE_URL}/api/sleep/:id/stop`, () => {
    const entry = createSleepEntry({ status: "completed" });
    return HttpResponse.json({ data: { entry } });
  }),

  http.put(`${BASE_URL}/api/sleep/:id`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const entry = createSleepEntry(
      body as Partial<ReturnType<typeof createSleepEntry>>,
    );
    return HttpResponse.json({ data: { entry } });
  }),

  http.delete(`${BASE_URL}/api/sleep/:id`, () => {
    return HttpResponse.json({ data: { success: true } });
  }),

  // Feed
  http.get(`${BASE_URL}/api/feed`, () => {
    return HttpResponse.json({
      data: { entries: [createFeedEntry()] },
    });
  }),

  http.get(`${BASE_URL}/api/feed/active`, () => {
    return HttpResponse.json({ data: { entry: null } });
  }),

  http.post(`${BASE_URL}/api/feed/breast/start`, async ({ request }) => {
    const body = (await request.json()) as { side: "left" | "right" };
    const entry = createFeedEntry({
      type: "breast",
      side: body.side,
      status: "active",
      ended_at: null,
    });
    return HttpResponse.json({ data: { entry } });
  }),

  http.post(`${BASE_URL}/api/feed/formula`, async ({ request }) => {
    const body = (await request.json()) as {
      amount_ml: number;
      notes?: string;
    };
    const entry = createFeedEntry({
      type: "formula",
      side: null,
      amount_ml: body.amount_ml,
      notes: body.notes ?? null,
    });
    return HttpResponse.json({ data: { entry } });
  }),

  http.post(`${BASE_URL}/api/feed/expressed`, async ({ request }) => {
    const body = (await request.json()) as {
      amount_ml: number;
      notes?: string;
    };
    const entry = createFeedEntry({
      type: "expressed",
      side: null,
      amount_ml: body.amount_ml,
      notes: body.notes ?? null,
    });
    return HttpResponse.json({ data: { entry } });
  }),

  http.post(`${BASE_URL}/api/feed/:id/pause`, () => {
    const entry = createFeedEntry({ status: "paused" });
    return HttpResponse.json({ data: { entry } });
  }),

  http.post(`${BASE_URL}/api/feed/:id/resume`, () => {
    const entry = createFeedEntry({ status: "active" });
    return HttpResponse.json({ data: { entry } });
  }),

  http.post(`${BASE_URL}/api/feed/:id/stop`, () => {
    const entry = createFeedEntry({ status: "completed" });
    return HttpResponse.json({ data: { entry } });
  }),

  http.put(`${BASE_URL}/api/feed/:id`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const entry = createFeedEntry(
      body as Partial<ReturnType<typeof createFeedEntry>>,
    );
    return HttpResponse.json({ data: { entry } });
  }),

  http.delete(`${BASE_URL}/api/feed/:id`, () => {
    return HttpResponse.json({ data: { success: true } });
  }),

  // Nappy
  http.get(`${BASE_URL}/api/nappy`, () => {
    return HttpResponse.json({
      data: { entries: [createNappyEntry()] },
    });
  }),

  http.post(`${BASE_URL}/api/nappy`, async ({ request }) => {
    const body = (await request.json()) as {
      type: "wet" | "dirty" | "both";
      notes?: string;
    };
    const entry = createNappyEntry({
      type: body.type,
      notes: body.notes ?? null,
    });
    return HttpResponse.json({ data: { entry } });
  }),

  http.put(`${BASE_URL}/api/nappy/:id`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const entry = createNappyEntry(
      body as Partial<ReturnType<typeof createNappyEntry>>,
    );
    return HttpResponse.json({ data: { entry } });
  }),

  http.delete(`${BASE_URL}/api/nappy/:id`, () => {
    return HttpResponse.json({ data: { success: true } });
  }),

  // Pump
  http.get(`${BASE_URL}/api/pump`, () => {
    return HttpResponse.json({
      data: { entries: [createPumpEntry()] },
    });
  }),

  http.get(`${BASE_URL}/api/pump/active`, () => {
    return HttpResponse.json({ data: { entry: null } });
  }),

  http.post(`${BASE_URL}/api/pump/start`, () => {
    const entry = createPumpEntry({ status: "active", ended_at: null });
    return HttpResponse.json({ data: { entry } });
  }),

  http.post(`${BASE_URL}/api/pump/:id/pause`, () => {
    const entry = createPumpEntry({ status: "paused" });
    return HttpResponse.json({ data: { entry } });
  }),

  http.post(`${BASE_URL}/api/pump/:id/resume`, () => {
    const entry = createPumpEntry({ status: "active" });
    return HttpResponse.json({ data: { entry } });
  }),

  http.post(`${BASE_URL}/api/pump/:id/stop`, () => {
    const entry = createPumpEntry({ status: "completed" });
    return HttpResponse.json({ data: { entry } });
  }),

  http.put(`${BASE_URL}/api/pump/:id`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const entry = createPumpEntry(
      body as Partial<ReturnType<typeof createPumpEntry>>,
    );
    return HttpResponse.json({ data: { entry } });
  }),

  http.delete(`${BASE_URL}/api/pump/:id`, () => {
    return HttpResponse.json({ data: { success: true } });
  }),

  // Daily Tasks
  http.get(`${BASE_URL}/api/daily-tasks`, () => {
    return HttpResponse.json({
      data: { tasks: [createDailyTask({ id: 1, name: "Vitamin D" })] },
    });
  }),

  http.post(`${BASE_URL}/api/daily-tasks`, async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      frequency_days: number;
      start_date?: string;
    };
    const task = createDailyTask({
      name: body.name,
      frequency_days: body.frequency_days,
      start_date: body.start_date ?? null,
    });
    return HttpResponse.json({ data: { task } }, { status: 201 });
  }),

  http.put(`${BASE_URL}/api/daily-tasks/:id`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const task = createDailyTask(
      body as Partial<ReturnType<typeof createDailyTask>>,
    );
    return HttpResponse.json({ data: { task } });
  }),

  http.delete(`${BASE_URL}/api/daily-tasks/:id`, () => {
    return HttpResponse.json({ data: { success: true } });
  }),

  http.post(`${BASE_URL}/api/daily-tasks/:id/complete`, () => {
    return HttpResponse.json({
      data: {
        completion: {
          id: 1,
          task_id: 1,
          completed_at: new Date().toISOString(),
        },
      },
    });
  }),

  http.delete(`${BASE_URL}/api/daily-tasks/:id/complete`, () => {
    return HttpResponse.json({ data: { success: true } });
  }),

  // History
  http.get(`${BASE_URL}/api/history`, ({ request }) => {
    const url = new URL(request.url);
    const date =
      url.searchParams.get("date") ?? new Date().toISOString().split("T")[0];
    return HttpResponse.json({
      data: { date, events: [] },
    });
  }),

  http.get(`${BASE_URL}/api/history/summary`, () => {
    return HttpResponse.json({
      data: {
        total_sleeps: 5,
        total_feeds: 8,
        total_nappies: 12,
        avg_sleep_duration: 7200,
      },
    });
  }),
];
