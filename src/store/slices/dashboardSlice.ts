import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "../../lib/api";

interface ActiveTimer {
  type: "sleep" | "feed" | "pump";
  entry: Record<string, unknown>;
}

interface TodayStats {
  nappy_count: number;
  nappy_target: number;
  feed_count: number;
  hours_since_last_feed: number | null;
  feed_interval_target: number;
}

interface DailyTasksSummary {
  total_count: number;
  due_count: number;
  completed_count: number;
}

interface DashboardState {
  activeTimers: ActiveTimer[];
  lastSleep: Record<string, unknown> | null;
  lastFeed: Record<string, unknown> | null;
  lastNappy: Record<string, unknown> | null;
  lastPump: Record<string, unknown> | null;
  today: TodayStats | null;
  dailyTasks: DailyTasksSummary | null;
  isLoading: boolean;
}

const initialState: DashboardState = {
  activeTimers: [],
  lastSleep: null,
  lastFeed: null,
  lastNappy: null,
  lastPump: null,
  today: null,
  dailyTasks: null,
  isLoading: false,
};

export const fetchDashboard = createAsyncThunk(
  "dashboard/fetch",
  async (_, { rejectWithValue }) => {
    const response = await api.getDashboard();
    if (response.error) {
      return rejectWithValue(response.error);
    }
    return response.data!;
  },
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchDashboard.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchDashboard.fulfilled, (state, action) => {
      state.isLoading = false;
      state.activeTimers = action.payload.active_timers;
      state.lastSleep = action.payload.last_sleep;
      state.lastFeed = action.payload.last_feed;
      state.lastNappy = action.payload.last_nappy;
      state.lastPump = action.payload.last_pump;
      state.today = (action.payload as Record<string, unknown>)
        .today as TodayStats;
      state.dailyTasks = (action.payload as Record<string, unknown>)
        .daily_tasks as DailyTasksSummary | null;
    });
    builder.addCase(fetchDashboard.rejected, (state) => {
      state.isLoading = false;
    });
  },
});

export default dashboardSlice.reducer;
