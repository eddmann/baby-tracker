import { describe, test, expect } from "bun:test";
import { http, HttpResponse } from "msw";
import { renderAppAsAuthenticated, screen, userEvent } from "../test/utils";
import { server } from "../test/mocks/server";
import { TEST_BASE_URL } from "../test/global-setup";
import { createPumpEntry } from "../test/fixtures";
import Pump from "./Pump";

function setupPumpHandlers(options?: {
  active?: ReturnType<typeof createPumpEntry> | null;
  entries?: ReturnType<typeof createPumpEntry>[];
}) {
  const active = options?.active ?? null;
  const entries = options?.entries ?? [createPumpEntry({ id: 1 })];

  server.use(
    http.get(`${TEST_BASE_URL}/api/pump/active`, () => {
      return HttpResponse.json({ data: { entry: active } });
    }),
    http.get(`${TEST_BASE_URL}/api/pump`, () => {
      return HttpResponse.json({ data: { entries } });
    }),
  );
}

describe("Pump", () => {
  test("shows start button when no active timer", async () => {
    setupPumpHandlers();
    renderAppAsAuthenticated(<Pump />);

    expect(
      await screen.findByRole("button", { name: /start pump/i }),
    ).toBeInTheDocument();
  });

  test("starts pump timer and shows success toast", async () => {
    setupPumpHandlers();
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Pump />);

    await user.click(
      await screen.findByRole("button", { name: /start pump/i }),
    );

    expect(await screen.findByText(/pump timer started/i)).toBeInTheDocument();
  });

  test("shows active timer with pause/stop controls", async () => {
    setupPumpHandlers({
      active: createPumpEntry({
        id: 99,
        status: "active",
        ended_at: null,
        started_at: new Date().toISOString(),
      }),
    });
    renderAppAsAuthenticated(<Pump />);

    expect(await screen.findByText(/pumping/i)).toBeInTheDocument();
  });

  test("opens stop modal with amount input on stop", async () => {
    setupPumpHandlers({
      active: createPumpEntry({
        id: 99,
        status: "active",
        ended_at: null,
        started_at: new Date().toISOString(),
      }),
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Pump />);

    await user.click(await screen.findByRole("button", { name: /stop/i }));

    expect(await screen.findByText("End Pump Session")).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
  });

  test("saves pump session with amount", async () => {
    setupPumpHandlers({
      active: createPumpEntry({
        id: 99,
        status: "active",
        ended_at: null,
        started_at: new Date().toISOString(),
      }),
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Pump />);

    await user.click(await screen.findByRole("button", { name: /stop/i }));

    await user.type(await screen.findByLabelText(/amount/i), "80");
    await user.click(screen.getByRole("button", { name: /save session/i }));

    expect(
      await screen.findByText(/pump session recorded/i),
    ).toBeInTheDocument();
  });

  test("shows error toast when start fails", async () => {
    setupPumpHandlers();
    server.use(
      http.post(`${TEST_BASE_URL}/api/pump/start`, () => {
        return HttpResponse.json({ error: "Already active" }, { status: 409 });
      }),
    );
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Pump />);

    await user.click(
      await screen.findByRole("button", { name: /start pump/i }),
    );

    expect(await screen.findByText("Already active")).toBeInTheDocument();
  });

  test("shows recent completed entries", async () => {
    setupPumpHandlers({
      entries: [
        createPumpEntry({ id: 1, amount_ml: 120, duration_seconds: 1200 }),
        createPumpEntry({ id: 2, amount_ml: 80, duration_seconds: 900 }),
      ],
    });
    renderAppAsAuthenticated(<Pump />);

    expect(await screen.findByText("120ml")).toBeInTheDocument();
    expect(screen.getByText("80ml")).toBeInTheDocument();
  });

  test("shows empty state when no entries", async () => {
    setupPumpHandlers({ entries: [] });
    renderAppAsAuthenticated(<Pump />);

    expect(
      await screen.findByText(/no pump sessions yet/i),
    ).toBeInTheDocument();
  });

  test("opens edit modal when clicking an entry", async () => {
    setupPumpHandlers({
      entries: [createPumpEntry({ id: 1, amount_ml: 120 })],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Pump />);

    await user.click(await screen.findByText("120ml"));

    expect(await screen.findByText("Edit Pump")).toBeInTheDocument();
  });

  test("opens edit modal with prefilled data", async () => {
    setupPumpHandlers({
      entries: [
        createPumpEntry({
          id: 1,
          amount_ml: 90,
          notes: "Morning pump",
        }),
      ],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Pump />);

    await user.click(await screen.findByText("90ml"));

    expect(await screen.findByText("Edit Pump")).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toHaveValue(90);
    expect(screen.getByLabelText(/notes/i)).toHaveValue("Morning pump");
  });

  test("keeps edit modal open when save fails", async () => {
    setupPumpHandlers({
      entries: [createPumpEntry({ id: 1, amount_ml: 120 })],
    });
    server.use(
      http.put(`${TEST_BASE_URL}/api/pump/:id`, () => {
        return HttpResponse.json({ error: "Update failed" }, { status: 500 });
      }),
    );
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Pump />);

    await user.click(await screen.findByText("120ml"));
    expect(await screen.findByText("Edit Pump")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByText("Update failed")).toBeInTheDocument();
    expect(screen.getByText("Edit Pump")).toBeInTheDocument();
  });

  test("closes edit modal without saving on close", async () => {
    setupPumpHandlers({
      entries: [createPumpEntry({ id: 1, amount_ml: 120 })],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Pump />);

    await user.click(await screen.findByText("120ml"));
    expect(await screen.findByText("Edit Pump")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(screen.queryByText("Edit Pump")).not.toBeInTheDocument();
  });

  test("closes stop modal on close", async () => {
    setupPumpHandlers({
      active: createPumpEntry({
        id: 99,
        status: "active",
        ended_at: null,
        started_at: new Date().toISOString(),
      }),
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Pump />);

    await user.click(await screen.findByRole("button", { name: /stop/i }));
    expect(await screen.findByText("End Pump Session")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(screen.queryByText("End Pump Session")).not.toBeInTheDocument();
  });

  test("deletes entry with double-tap confirmation", async () => {
    setupPumpHandlers({
      entries: [createPumpEntry({ id: 1, amount_ml: 120 })],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Pump />);

    await user.click(await screen.findByText("120ml"));
    expect(await screen.findByText("Edit Pump")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(
      await screen.findByText(/tap again to confirm delete/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /tap again to confirm delete/i }),
    );

    expect(await screen.findByText(/pump deleted/i)).toBeInTheDocument();
    expect(screen.queryByText("Edit Pump")).not.toBeInTheDocument();
  });

  test("does not show empty state while loading", async () => {
    setupPumpHandlers({ entries: [] });
    renderAppAsAuthenticated(<Pump />);

    // Start button appears immediately
    expect(
      await screen.findByRole("button", { name: /start pump/i }),
    ).toBeInTheDocument();

    // Empty state appears after loading
    expect(
      await screen.findByText(/no pump sessions yet/i),
    ).toBeInTheDocument();
  });
});
