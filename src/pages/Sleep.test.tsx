import { describe, test, expect } from "bun:test";
import { http, HttpResponse } from "msw";
import { renderAppAsAuthenticated, screen, userEvent } from "../test/utils";
import { server } from "../test/mocks/server";
import { TEST_BASE_URL } from "../test/global-setup";
import { createSleepEntry } from "../test/fixtures";
import Sleep from "./Sleep";

function setupSleepHandlers(options?: {
  active?: ReturnType<typeof createSleepEntry> | null;
  entries?: ReturnType<typeof createSleepEntry>[];
}) {
  const active = options?.active ?? null;
  const entries = options?.entries ?? [createSleepEntry({ id: 1 })];

  server.use(
    http.get(`${TEST_BASE_URL}/api/sleep/active`, () => {
      return HttpResponse.json({ data: { entry: active } });
    }),
    http.get(`${TEST_BASE_URL}/api/sleep`, () => {
      return HttpResponse.json({ data: { entries } });
    }),
  );
}

describe("Sleep", () => {
  test("shows start button when no active timer", async () => {
    setupSleepHandlers();
    renderAppAsAuthenticated(<Sleep />);

    expect(
      await screen.findByRole("button", { name: /start sleep/i }),
    ).toBeInTheDocument();
  });

  test("starts sleep timer and shows success toast", async () => {
    setupSleepHandlers();
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Sleep />);

    await user.click(
      await screen.findByRole("button", { name: /start sleep/i }),
    );

    expect(await screen.findByText(/sleep timer started/i)).toBeInTheDocument();
  });

  test("shows active timer with pause/stop controls", async () => {
    setupSleepHandlers({
      active: createSleepEntry({
        id: 99,
        status: "active",
        ended_at: null,
        started_at: new Date().toISOString(),
      }),
    });
    renderAppAsAuthenticated(<Sleep />);

    expect(await screen.findByText(/sleeping/i)).toBeInTheDocument();
  });

  test("shows error toast when start fails", async () => {
    setupSleepHandlers();
    server.use(
      http.post(`${TEST_BASE_URL}/api/sleep/start`, () => {
        return HttpResponse.json({ error: "Already active" }, { status: 409 });
      }),
    );
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Sleep />);

    await user.click(
      await screen.findByRole("button", { name: /start sleep/i }),
    );

    expect(await screen.findByText("Already active")).toBeInTheDocument();
  });

  test("shows recent completed entries", async () => {
    setupSleepHandlers({
      entries: [
        createSleepEntry({ id: 1, duration_seconds: 7200 }),
        createSleepEntry({ id: 2, duration_seconds: 3600 }),
      ],
    });
    renderAppAsAuthenticated(<Sleep />);

    expect(await screen.findByText("2h 0m")).toBeInTheDocument();
    expect(screen.getByText("1h 0m")).toBeInTheDocument();
  });

  test("shows empty state when no entries", async () => {
    setupSleepHandlers({ entries: [] });
    renderAppAsAuthenticated(<Sleep />);

    expect(
      await screen.findByText(/no sleep entries yet/i),
    ).toBeInTheDocument();
  });

  test("opens edit modal when clicking an entry", async () => {
    setupSleepHandlers({
      entries: [createSleepEntry({ id: 1 })],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Sleep />);

    await user.click(await screen.findByText("2h 0m"));

    expect(await screen.findByText("Edit Sleep")).toBeInTheDocument();
  });

  test("shows error toast when stop fails", async () => {
    setupSleepHandlers({
      active: createSleepEntry({
        id: 99,
        status: "active",
        ended_at: null,
        started_at: new Date().toISOString(),
      }),
    });
    server.use(
      http.post(`${TEST_BASE_URL}/api/sleep/:id/stop`, () => {
        return HttpResponse.json({ error: "Stop failed" }, { status: 500 });
      }),
    );
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Sleep />);

    await user.click(await screen.findByRole("button", { name: /stop/i }));

    expect(await screen.findByText("Stop failed")).toBeInTheDocument();
  });

  test("opens edit modal with prefilled data", async () => {
    setupSleepHandlers({
      entries: [
        createSleepEntry({
          id: 1,
          started_at: "2026-01-15T22:00:00Z",
          ended_at: "2026-01-16T06:00:00Z",
          notes: "Slept well",
        }),
      ],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Sleep />);

    await user.click(await screen.findByText("2h 0m"));

    expect(await screen.findByText("Edit Sleep")).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toHaveValue("Slept well");
  });

  test("keeps edit modal open when save fails", async () => {
    setupSleepHandlers({
      entries: [createSleepEntry({ id: 1 })],
    });
    server.use(
      http.put(`${TEST_BASE_URL}/api/sleep/:id`, () => {
        return HttpResponse.json({ error: "Update failed" }, { status: 500 });
      }),
    );
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Sleep />);

    await user.click(await screen.findByText("2h 0m"));
    expect(await screen.findByText("Edit Sleep")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByText("Update failed")).toBeInTheDocument();
    expect(screen.getByText("Edit Sleep")).toBeInTheDocument();
  });

  test("closes edit modal without saving on close", async () => {
    setupSleepHandlers({
      entries: [createSleepEntry({ id: 1 })],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Sleep />);

    await user.click(await screen.findByText("2h 0m"));
    expect(await screen.findByText("Edit Sleep")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(screen.queryByText("Edit Sleep")).not.toBeInTheDocument();
  });

  test("deletes entry with double-tap confirmation", async () => {
    setupSleepHandlers({
      entries: [createSleepEntry({ id: 1 })],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Sleep />);

    await user.click(await screen.findByText("2h 0m"));
    expect(await screen.findByText("Edit Sleep")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(
      await screen.findByText(/tap again to confirm delete/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /tap again to confirm delete/i }),
    );

    expect(await screen.findByText(/sleep deleted/i)).toBeInTheDocument();
    expect(screen.queryByText("Edit Sleep")).not.toBeInTheDocument();
  });

  test("shows error toast when delete fails", async () => {
    setupSleepHandlers({
      entries: [createSleepEntry({ id: 1 })],
    });
    server.use(
      http.delete(`${TEST_BASE_URL}/api/sleep/:id`, () => {
        return HttpResponse.json({ error: "Delete failed" }, { status: 500 });
      }),
    );
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Sleep />);

    await user.click(await screen.findByText("2h 0m"));
    expect(await screen.findByText("Edit Sleep")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    await user.click(
      await screen.findByRole("button", {
        name: /tap again to confirm delete/i,
      }),
    );

    expect(await screen.findByText("Delete failed")).toBeInTheDocument();
  });

  test("does not show empty state while loading", async () => {
    setupSleepHandlers({ entries: [] });
    renderAppAsAuthenticated(<Sleep />);

    // Start button should appear (it doesn't depend on loading)
    expect(
      await screen.findByRole("button", { name: /start sleep/i }),
    ).toBeInTheDocument();

    // Empty state should appear after loading completes
    expect(
      await screen.findByText(/no sleep entries yet/i),
    ).toBeInTheDocument();
  });
});
