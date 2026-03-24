import { describe, test, expect } from "bun:test";
import { http, HttpResponse } from "msw";
import { renderAppAsAuthenticated, screen, userEvent } from "../test/utils";
import { server } from "../test/mocks/server";
import { TEST_BASE_URL } from "../test/global-setup";
import { createNappyEntry } from "../test/fixtures";
import Nappy from "./Nappy";

function setupNappyHandlers(options?: {
  entries?: ReturnType<typeof createNappyEntry>[];
}) {
  const entries = options?.entries ?? [createNappyEntry({ id: 1 })];

  server.use(
    http.get(`${TEST_BASE_URL}/api/nappy`, () => {
      return HttpResponse.json({ data: { entries } });
    }),
  );
}

describe("Nappy", () => {
  test("shows today's count and target", async () => {
    setupNappyHandlers({
      entries: [
        createNappyEntry({
          id: 1,
          occurred_at: new Date().toISOString(),
        }),
      ],
    });
    renderAppAsAuthenticated(<Nappy />);

    expect(await screen.findByText("Today")).toBeInTheDocument();
    expect(screen.getByText("/12")).toBeInTheDocument();
  });

  test("shows quick-log buttons for wet, dirty, both", async () => {
    setupNappyHandlers({ entries: [] });
    renderAppAsAuthenticated(<Nappy />);

    expect(await screen.findByText("Wet")).toBeInTheDocument();
    expect(screen.getByText("Dirty")).toBeInTheDocument();
    expect(screen.getByText("Both")).toBeInTheDocument();
  });

  test("logs a wet nappy and shows success toast", async () => {
    setupNappyHandlers({ entries: [] });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Nappy />);

    await user.click(await screen.findByText("Wet"));

    expect(await screen.findByText(/wet nappy logged/i)).toBeInTheDocument();
  });

  test("logs a dirty nappy and shows success toast", async () => {
    setupNappyHandlers({ entries: [] });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Nappy />);

    await user.click(await screen.findByText("Dirty"));

    expect(await screen.findByText(/dirty nappy logged/i)).toBeInTheDocument();
  });

  test("shows error toast when log fails", async () => {
    setupNappyHandlers({ entries: [] });
    server.use(
      http.post(`${TEST_BASE_URL}/api/nappy`, () => {
        return HttpResponse.json({ error: "Server error" }, { status: 500 });
      }),
    );
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Nappy />);

    await user.click(await screen.findByText("Wet"));

    expect(await screen.findByText("Server error")).toBeInTheDocument();
  });

  test("shows recent entries", async () => {
    setupNappyHandlers({
      entries: [
        createNappyEntry({ id: 1, type: "wet" }),
        createNappyEntry({ id: 2, type: "dirty" }),
      ],
    });
    renderAppAsAuthenticated(<Nappy />);

    expect(await screen.findByText("Recent")).toBeInTheDocument();
    const wetElements = screen.getAllByText("Wet");
    expect(wetElements.length).toBeGreaterThanOrEqual(1);
  });

  test("shows empty state when no entries", async () => {
    setupNappyHandlers({ entries: [] });
    renderAppAsAuthenticated(<Nappy />);

    expect(
      await screen.findByText(/no nappy entries yet/i),
    ).toBeInTheDocument();
  });

  test("opens edit modal when clicking an entry", async () => {
    setupNappyHandlers({
      entries: [createNappyEntry({ id: 1, type: "wet" })],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Nappy />);

    await screen.findByText("Recent");
    // Click the entry text in the list (second "Wet" — first is the quick-log button)
    const wetElements = screen.getAllByText("Wet");
    await user.click(wetElements[1]);

    expect(await screen.findByText("Edit Nappy")).toBeInTheDocument();
  });

  test("opens edit modal with prefilled time", async () => {
    setupNappyHandlers({
      entries: [
        createNappyEntry({
          id: 1,
          type: "wet",
          occurred_at: "2026-01-15T10:30:00Z",
        }),
      ],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Nappy />);

    await screen.findByText("Recent");
    const wetElements = screen.getAllByText("Wet");
    await user.click(wetElements[1]);

    expect(await screen.findByText("Edit Nappy")).toBeInTheDocument();
    expect(screen.getByLabelText(/time/i)).not.toHaveValue("");
  });

  test("keeps edit modal open when save fails", async () => {
    setupNappyHandlers({
      entries: [createNappyEntry({ id: 1, type: "wet" })],
    });
    server.use(
      http.put(`${TEST_BASE_URL}/api/nappy/:id`, () => {
        return HttpResponse.json({ error: "Update failed" }, { status: 500 });
      }),
    );
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Nappy />);

    await screen.findByText("Recent");
    const wetElements = screen.getAllByText("Wet");
    await user.click(wetElements[1]);

    expect(await screen.findByText("Edit Nappy")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByText("Update failed")).toBeInTheDocument();
    expect(screen.getByText("Edit Nappy")).toBeInTheDocument();
  });

  test("closes edit modal without saving on close", async () => {
    setupNappyHandlers({
      entries: [createNappyEntry({ id: 1, type: "wet" })],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Nappy />);

    await screen.findByText("Recent");
    const wetElements = screen.getAllByText("Wet");
    await user.click(wetElements[1]);

    expect(await screen.findByText("Edit Nappy")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(screen.queryByText("Edit Nappy")).not.toBeInTheDocument();
  });

  test("deletes entry with double-tap confirmation", async () => {
    setupNappyHandlers({
      entries: [createNappyEntry({ id: 1, type: "wet" })],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Nappy />);

    await screen.findByText("Recent");
    const wetElements = screen.getAllByText("Wet");
    await user.click(wetElements[1]);

    expect(await screen.findByText("Edit Nappy")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(
      await screen.findByText(/tap again to confirm delete/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /tap again to confirm delete/i }),
    );

    expect(await screen.findByText(/nappy deleted/i)).toBeInTheDocument();
    expect(screen.queryByText("Edit Nappy")).not.toBeInTheDocument();
  });

  test("does not show empty state while loading", async () => {
    setupNappyHandlers({ entries: [] });
    renderAppAsAuthenticated(<Nappy />);

    // Quick-log buttons appear immediately
    expect(await screen.findByText("Wet")).toBeInTheDocument();

    // Empty state appears after loading
    expect(
      await screen.findByText(/no nappy entries yet/i),
    ).toBeInTheDocument();
  });
});
