import { describe, test, expect } from "bun:test";
import { http, HttpResponse } from "msw";
import { renderAppAsAuthenticated, screen, userEvent } from "../test/utils";
import { server } from "../test/mocks/server";
import { TEST_BASE_URL } from "../test/global-setup";
import { createDashboardData } from "../test/fixtures";
import Dashboard from "./Dashboard";

function setupDashboardHandlers(
  overrides?: Parameters<typeof createDashboardData>[0],
) {
  const data = createDashboardData(overrides);
  server.use(
    http.get(`${TEST_BASE_URL}/api/dashboard`, () => {
      return HttpResponse.json({ data });
    }),
  );
  return data;
}

describe("Dashboard", () => {
  test("loads dashboard data and shows today's stats", async () => {
    setupDashboardHandlers();
    renderAppAsAuthenticated(<Dashboard />);

    expect(await screen.findByText(/nappies today/i)).toBeInTheDocument();
    expect(screen.getByText(/since last feed/i)).toBeInTheDocument();
  });

  test("shows active timer with pause/stop controls", async () => {
    setupDashboardHandlers({
      active_timers: [
        {
          type: "sleep",
          entry: {
            id: 1,
            started_at: new Date().toISOString(),
            pauses: "[]",
            status: "active",
          },
        },
      ],
    });
    renderAppAsAuthenticated(<Dashboard />);

    expect(await screen.findByText(/sleep/i)).toBeInTheDocument();
  });

  test("shows time-since cards for last feed, sleep, nappy", async () => {
    setupDashboardHandlers();
    renderAppAsAuthenticated(<Dashboard />);

    expect(await screen.findByText("Last Feed")).toBeInTheDocument();
    expect(screen.getByText("Last Sleep")).toBeInTheDocument();
    expect(screen.getByText("Last Nappy")).toBeInTheDocument();
  });

  test("shows 'No entries yet' when no last entries", async () => {
    setupDashboardHandlers({
      last_sleep: null,
      last_feed: null,
      last_nappy: null,
      last_pump: null,
    });
    renderAppAsAuthenticated(<Dashboard />);

    expect(await screen.findByText("Last Feed")).toBeInTheDocument();
    const noEntries = screen.getAllByText("No entries yet");
    expect(noEntries.length).toBe(3);
  });

  test("opens quick-add modal and logs a wet nappy", async () => {
    setupDashboardHandlers();
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Dashboard />);

    await user.click(await screen.findByText("Log"));
    await user.click(await screen.findByText("Wet Nappy"));

    expect(await screen.findByText(/wet nappy logged/i)).toBeInTheDocument();
  });

  test("opens quick-add modal and starts sleep timer", async () => {
    setupDashboardHandlers();
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Dashboard />);

    await user.click(await screen.findByText("Log"));
    await user.click(await screen.findByText("Sleep"));

    expect(await screen.findByText(/sleep timer started/i)).toBeInTheDocument();
  });

  test("shows daily tasks summary card and navigates on click", async () => {
    setupDashboardHandlers({
      daily_tasks: {
        total_count: 3,
        due_count: 2,
        completed_count: 1,
      },
    });
    renderAppAsAuthenticated(<Dashboard />);

    expect(await screen.findByText("Daily Tasks")).toBeInTheDocument();
    expect(screen.getByText(/1 of 2 due tasks done/i)).toBeInTheDocument();
  });

  test("hides daily tasks card when no tasks exist", async () => {
    setupDashboardHandlers({
      daily_tasks: null,
    });
    renderAppAsAuthenticated(<Dashboard />);

    expect(await screen.findByText("Last Feed")).toBeInTheDocument();
    expect(screen.queryByText("Daily Tasks")).not.toBeInTheDocument();
  });

  test("shows error toast when quick-add nappy fails", async () => {
    setupDashboardHandlers();
    server.use(
      http.post(`${TEST_BASE_URL}/api/nappy`, () => {
        return HttpResponse.json({ error: "Server error" }, { status: 500 });
      }),
    );
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Dashboard />);

    await user.click(await screen.findByText("Log"));
    await user.click(await screen.findByText("Wet Nappy"));

    expect(await screen.findByText("Server error")).toBeInTheDocument();
  });
});
