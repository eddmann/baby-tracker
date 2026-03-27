import { TOKEN_KEY } from "../../shared/constants";

export type ApiResponse<T> = { data?: T; error?: string };

const getApiBase = () => {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api`;
  }
  return "http://localhost:3000/api";
};

const API_BASE = getApiBase();

function getTzOffset(): number {
  return -new Date().getTimezoneOffset();
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = (await response.json()) as ApiResponse<T> & {
      error?: string;
    };

    if (!response.ok) {
      return {
        error:
          typeof data.error === "string" ? data.error : "An error occurred",
      };
    }

    return data;
  } catch {
    return { error: "Network error. Please try again." };
  }
}

// Auth
export async function verifyPin(
  pin: string,
): Promise<ApiResponse<{ token: string }>> {
  return fetchApi("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ pin }),
  });
}

export async function checkAuth(): Promise<ApiResponse<{ valid: boolean }>> {
  return fetchApi("/auth/check");
}

// Dashboard
export async function getDashboard(): Promise<
  ApiResponse<{
    active_timers: {
      type: "sleep" | "feed" | "pump";
      entry: Record<string, unknown>;
    }[];
    last_sleep: Record<string, unknown> | null;
    last_feed: Record<string, unknown> | null;
    last_nappy: Record<string, unknown> | null;
    last_pump: Record<string, unknown> | null;
  }>
> {
  return fetchApi(`/dashboard?tz=${getTzOffset()}`);
}

// Sleep
export async function startSleep(): Promise<
  ApiResponse<{ entry: Record<string, unknown> }>
> {
  return fetchApi("/sleep/start", { method: "POST" });
}

export async function pauseSleep(
  id: number,
): Promise<ApiResponse<{ entry: Record<string, unknown> }>> {
  return fetchApi(`/sleep/${id}/pause`, { method: "POST" });
}

export async function resumeSleep(
  id: number,
): Promise<ApiResponse<{ entry: Record<string, unknown> }>> {
  return fetchApi(`/sleep/${id}/resume`, { method: "POST" });
}

export async function stopSleep(
  id: number,
  notes?: string,
): Promise<ApiResponse<{ entry: Record<string, unknown> }>> {
  return fetchApi(`/sleep/${id}/stop`, {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
}

export async function getSleepEntries(): Promise<
  ApiResponse<{ entries: Record<string, unknown>[] }>
> {
  return fetchApi("/sleep");
}

export async function getActiveSleep(): Promise<
  ApiResponse<{ entry: Record<string, unknown> | null }>
> {
  return fetchApi("/sleep/active");
}

export async function updateSleep(
  id: number,
  fields: { started_at?: string; ended_at?: string; notes?: string | null },
): Promise<ApiResponse<{ entry: Record<string, unknown> }>> {
  return fetchApi(`/sleep/${id}`, {
    method: "PUT",
    body: JSON.stringify(fields),
  });
}

export async function deleteSleep(
  id: number,
): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi(`/sleep/${id}`, { method: "DELETE" });
}

// Feed
export async function startBreastFeed(
  side: "left" | "right",
): Promise<ApiResponse<{ entry: Record<string, unknown> }>> {
  return fetchApi("/feed/breast/start", {
    method: "POST",
    body: JSON.stringify({ side }),
  });
}

export async function logFormulaFeed(
  amountMl: number,
  notes?: string,
): Promise<ApiResponse<{ entry: Record<string, unknown> }>> {
  return fetchApi("/feed/formula", {
    method: "POST",
    body: JSON.stringify({ amount_ml: amountMl, notes }),
  });
}

export async function logExpressedFeed(
  amountMl: number,
  notes?: string,
): Promise<ApiResponse<{ entry: Record<string, unknown> }>> {
  return fetchApi("/feed/expressed", {
    method: "POST",
    body: JSON.stringify({ amount_ml: amountMl, notes }),
  });
}

export async function pauseFeed(
  id: number,
): Promise<ApiResponse<{ entry: Record<string, unknown> }>> {
  return fetchApi(`/feed/${id}/pause`, { method: "POST" });
}

export async function resumeFeed(
  id: number,
): Promise<ApiResponse<{ entry: Record<string, unknown> }>> {
  return fetchApi(`/feed/${id}/resume`, { method: "POST" });
}

export async function stopFeed(
  id: number,
  notes?: string,
): Promise<ApiResponse<{ entry: Record<string, unknown> }>> {
  return fetchApi(`/feed/${id}/stop`, {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
}

export async function getFeedEntries(): Promise<
  ApiResponse<{ entries: Record<string, unknown>[] }>
> {
  return fetchApi("/feed");
}

export async function getActiveFeed(): Promise<
  ApiResponse<{ entry: Record<string, unknown> | null }>
> {
  return fetchApi("/feed/active");
}

export async function updateFeed(
  id: number,
  fields: {
    started_at?: string;
    ended_at?: string;
    side?: string;
    amount_ml?: number;
    is_tracked?: boolean;
    notes?: string | null;
  },
): Promise<ApiResponse<{ entry: Record<string, unknown> }>> {
  return fetchApi(`/feed/${id}`, {
    method: "PUT",
    body: JSON.stringify(fields),
  });
}

export async function deleteFeed(
  id: number,
): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi(`/feed/${id}`, { method: "DELETE" });
}

// Nappy
export async function logNappy(
  type: "wet" | "dirty" | "both",
  notes?: string,
): Promise<ApiResponse<{ entry: Record<string, unknown> }>> {
  return fetchApi("/nappy", {
    method: "POST",
    body: JSON.stringify({ type, notes }),
  });
}

export async function getNappyEntries(): Promise<
  ApiResponse<{ entries: Record<string, unknown>[] }>
> {
  return fetchApi("/nappy");
}

export async function updateNappy(
  id: number,
  fields: { type?: string; occurred_at?: string; notes?: string | null },
): Promise<ApiResponse<{ entry: Record<string, unknown> }>> {
  return fetchApi(`/nappy/${id}`, {
    method: "PUT",
    body: JSON.stringify(fields),
  });
}

export async function deleteNappy(
  id: number,
): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi(`/nappy/${id}`, { method: "DELETE" });
}

// Pump
export async function startPump(): Promise<
  ApiResponse<{ entry: Record<string, unknown> }>
> {
  return fetchApi("/pump/start", { method: "POST" });
}

export async function pausePump(
  id: number,
): Promise<ApiResponse<{ entry: Record<string, unknown> }>> {
  return fetchApi(`/pump/${id}/pause`, { method: "POST" });
}

export async function resumePump(
  id: number,
): Promise<ApiResponse<{ entry: Record<string, unknown> }>> {
  return fetchApi(`/pump/${id}/resume`, { method: "POST" });
}

export async function stopPump(
  id: number,
  amountMl?: number,
  notes?: string,
): Promise<ApiResponse<{ entry: Record<string, unknown> }>> {
  return fetchApi(`/pump/${id}/stop`, {
    method: "POST",
    body: JSON.stringify({ amount_ml: amountMl, notes }),
  });
}

export async function getPumpEntries(): Promise<
  ApiResponse<{ entries: Record<string, unknown>[] }>
> {
  return fetchApi("/pump");
}

export async function getActivePump(): Promise<
  ApiResponse<{ entry: Record<string, unknown> | null }>
> {
  return fetchApi("/pump/active");
}

export async function updatePump(
  id: number,
  fields: {
    started_at?: string;
    ended_at?: string;
    amount_ml?: number;
    notes?: string | null;
  },
): Promise<ApiResponse<{ entry: Record<string, unknown> }>> {
  return fetchApi(`/pump/${id}`, {
    method: "PUT",
    body: JSON.stringify(fields),
  });
}

export async function deletePump(
  id: number,
): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi(`/pump/${id}`, { method: "DELETE" });
}

// Daily Tasks
export async function getDailyTasks(): Promise<
  ApiResponse<{ tasks: Record<string, unknown>[] }>
> {
  return fetchApi(`/daily-tasks?tz=${getTzOffset()}`);
}

export async function createDailyTask(
  name: string,
  frequencyDays: number,
  startDate?: string,
): Promise<ApiResponse<{ task: Record<string, unknown> }>> {
  return fetchApi("/daily-tasks", {
    method: "POST",
    body: JSON.stringify({
      name,
      frequency_days: frequencyDays,
      ...(startDate ? { start_date: startDate } : {}),
    }),
  });
}

export async function updateDailyTask(
  id: number,
  fields: {
    name?: string;
    frequency_days?: number;
    start_date?: string | null;
  },
): Promise<ApiResponse<{ task: Record<string, unknown> }>> {
  return fetchApi(`/daily-tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(fields),
  });
}

export async function deleteDailyTask(
  id: number,
): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi(`/daily-tasks/${id}`, { method: "DELETE" });
}

export async function completeDailyTask(
  id: number,
): Promise<ApiResponse<{ completion: Record<string, unknown> }>> {
  return fetchApi(`/daily-tasks/${id}/complete`, { method: "POST" });
}

export async function uncompleteDailyTask(
  id: number,
): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi(`/daily-tasks/${id}/complete?tz=${getTzOffset()}`, {
    method: "DELETE",
  });
}

// Growth
export async function logGrowth(
  weightGrams: number | null,
  heightMm: number | null,
  measuredAt?: string,
  notes?: string,
): Promise<ApiResponse<{ entry: Record<string, unknown> }>> {
  return fetchApi("/growth", {
    method: "POST",
    body: JSON.stringify({
      weight_grams: weightGrams,
      height_mm: heightMm,
      measured_at: measuredAt,
      notes,
    }),
  });
}

export async function getGrowthEntries(): Promise<
  ApiResponse<{ entries: Record<string, unknown>[] }>
> {
  return fetchApi("/growth");
}

export async function updateGrowth(
  id: number,
  fields: {
    weight_grams?: number | null;
    height_mm?: number | null;
    measured_at?: string;
    notes?: string | null;
  },
): Promise<ApiResponse<{ entry: Record<string, unknown> }>> {
  return fetchApi(`/growth/${id}`, {
    method: "PUT",
    body: JSON.stringify(fields),
  });
}

export async function deleteGrowth(
  id: number,
): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi(`/growth/${id}`, { method: "DELETE" });
}

// History
export async function getHistory(
  date: string,
): Promise<ApiResponse<{ date: string; events: Record<string, unknown>[] }>> {
  return fetchApi(`/history?date=${date}&tz=${getTzOffset()}`);
}

export async function getHistorySummary(
  from: string,
  to: string,
): Promise<ApiResponse<Record<string, unknown>>> {
  return fetchApi(`/history/summary?from=${from}&to=${to}&tz=${getTzOffset()}`);
}
