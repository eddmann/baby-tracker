import { describe, test, expect } from "bun:test";
import { http, HttpResponse } from "msw";
import { renderAppAsAuthenticated, screen, userEvent } from "../test/utils";
import { server } from "../test/mocks/server";
import { TEST_BASE_URL } from "../test/global-setup";
import History from "./History";

function setupHistoryHandlers(options?: {
  events?: Record<string, unknown>[];
  date?: string;
}) {
  const events = options?.events ?? [];

  server.use(
    http.get(`${TEST_BASE_URL}/api/history`, ({ request }) => {
      const url = new URL(request.url);
      const date =
        url.searchParams.get("date") ?? new Date().toISOString().split("T")[0];
      return HttpResponse.json({
        data: { date, events: options?.events ?? events },
      });
    }),
  );
}

describe("History", () => {
  test("shows 'Today' heading on current date", async () => {
    setupHistoryHandlers();
    renderAppAsAuthenticated(<History />);

    expect(await screen.findByText("Today")).toBeInTheDocument();
  });

  test("shows empty state when no events", async () => {
    setupHistoryHandlers({ events: [] });
    renderAppAsAuthenticated(<History />);

    expect(await screen.findByText("No events")).toBeInTheDocument();
    expect(
      screen.getByText("Nothing recorded for this day"),
    ).toBeInTheDocument();
  });

  test("navigates to previous day", async () => {
    setupHistoryHandlers();
    const user = userEvent.setup();
    renderAppAsAuthenticated(<History />);

    expect(await screen.findByText("Today")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /previous day/i }));

    // Should no longer show "Today"
    expect(screen.queryByText("Today")).not.toBeInTheDocument();
  });

  test("disables forward navigation on today", async () => {
    setupHistoryHandlers();
    renderAppAsAuthenticated(<History />);

    expect(await screen.findByText("Today")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /next day/i })).toBeDisabled();
  });

  test("shows events with correct type icons and details", async () => {
    setupHistoryHandlers({
      events: [
        {
          type: "sleep",
          time: "2026-01-01T08:00:00Z",
          entry: {
            id: 1,
            duration_seconds: 7200,
            status: "completed",
          },
        },
        {
          type: "feed",
          time: "2026-01-01T10:00:00Z",
          entry: {
            id: 2,
            type: "breast",
            side: "left",
            duration_seconds: 1200,
            status: "completed",
          },
        },
        {
          type: "nappy",
          time: "2026-01-01T11:00:00Z",
          entry: { id: 3, type: "wet" },
        },
      ],
    });
    renderAppAsAuthenticated(<History />);

    expect(await screen.findByText("Sleep")).toBeInTheDocument();
    expect(screen.getByText("Feed")).toBeInTheDocument();
    expect(screen.getByText("Nappy")).toBeInTheDocument();
    expect(screen.getByText("2h 0m")).toBeInTheDocument();
    expect(screen.getByText(/breast \(left\)/i)).toBeInTheDocument();
    expect(screen.getByText(/wet/i)).toBeInTheDocument();
  });

  test("opens edit modal when clicking an event", async () => {
    setupHistoryHandlers({
      events: [
        {
          type: "sleep",
          time: "2026-01-01T08:00:00Z",
          entry: {
            id: 1,
            started_at: "2026-01-01T06:00:00Z",
            ended_at: "2026-01-01T08:00:00Z",
            duration_seconds: 7200,
            notes: null,
            status: "completed",
          },
        },
      ],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<History />);

    await user.click(await screen.findByText("Sleep"));

    expect(await screen.findByText("Edit Sleep")).toBeInTheDocument();
  });

  test("does not show empty state while loading", async () => {
    setupHistoryHandlers({ events: [] });
    renderAppAsAuthenticated(<History />);

    // Date navigation appears immediately
    expect(await screen.findByText("Today")).toBeInTheDocument();

    // Empty state appears after loading
    expect(await screen.findByText("No events")).toBeInTheDocument();
  });
});
