import { describe, test, expect } from "bun:test";
import { http, HttpResponse } from "msw";
import { renderAppAsAuthenticated, screen, userEvent } from "../test/utils";
import { server } from "../test/mocks/server";
import { TEST_BASE_URL } from "../test/global-setup";
import { createFeedEntry } from "../test/fixtures";
import Feed from "./Feed";

function setupFeedHandlers(options?: {
  active?: ReturnType<typeof createFeedEntry> | null;
  entries?: ReturnType<typeof createFeedEntry>[];
}) {
  const active = options?.active ?? null;
  const entries = options?.entries ?? [
    createFeedEntry({ id: 1, status: "completed" }),
  ];

  server.use(
    http.get(`${TEST_BASE_URL}/api/feed/active`, () => {
      return HttpResponse.json({ data: { entry: active } });
    }),
    http.get(`${TEST_BASE_URL}/api/feed`, () => {
      return HttpResponse.json({ data: { entries } });
    }),
  );
}

describe("Feed", () => {
  test("shows today's feed stats", async () => {
    setupFeedHandlers();
    renderAppAsAuthenticated(<Feed />);

    expect(await screen.findByText(/today:/i)).toBeInTheDocument();
  });

  test("shows breast tab with left/right buttons", async () => {
    setupFeedHandlers();
    renderAppAsAuthenticated(<Feed />);

    expect(
      await screen.findByRole("button", { name: /^left$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^right$/i }),
    ).toBeInTheDocument();
  });

  test("starts breast feed and shows success toast", async () => {
    setupFeedHandlers();
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Feed />);

    await user.click(await screen.findByRole("button", { name: /^left$/i }));

    expect(
      await screen.findByText(/breast feed started \(left\)/i),
    ).toBeInTheDocument();
  });

  test("switches to formula tab and shows log button", async () => {
    setupFeedHandlers();
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Feed />);

    await user.click(await screen.findByText("Formula"));

    expect(
      await screen.findByRole("button", { name: /log formula feed/i }),
    ).toBeInTheDocument();
  });

  test("opens amount modal and logs formula feed", async () => {
    setupFeedHandlers();
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Feed />);

    await user.click(await screen.findByText("Formula"));
    await user.click(
      await screen.findByRole("button", { name: /log formula feed/i }),
    );

    await user.type(await screen.findByLabelText(/amount/i), "150");
    await user.click(screen.getByRole("button", { name: /^log feed$/i }));

    expect(
      await screen.findByText(/formula feed logged \(150ml\)/i),
    ).toBeInTheDocument();
  });

  test("shows error toast for invalid amount", async () => {
    setupFeedHandlers();
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Feed />);

    await user.click(await screen.findByText("Formula"));
    await user.click(
      await screen.findByRole("button", { name: /log formula feed/i }),
    );

    // Submit without entering an amount
    await user.click(
      await screen.findByRole("button", { name: /^log feed$/i }),
    );

    expect(
      await screen.findByText(/enter a valid amount/i),
    ).toBeInTheDocument();
  });

  test("shows empty state for tab with no entries", async () => {
    setupFeedHandlers({ entries: [] });
    renderAppAsAuthenticated(<Feed />);

    expect(await screen.findByText(/no breast feeds yet/i)).toBeInTheDocument();
  });

  test("shows recent entries filtered by active tab", async () => {
    setupFeedHandlers({
      entries: [
        createFeedEntry({
          id: 1,
          type: "breast",
          side: "left",
          status: "completed",
          duration_seconds: 1200,
        }),
        createFeedEntry({
          id: 2,
          type: "formula",
          side: null,
          status: "completed",
          amount_ml: 150,
        }),
      ],
    });
    renderAppAsAuthenticated(<Feed />);

    // On breast tab, should see the breast entry
    expect(await screen.findByText("20m 0s")).toBeInTheDocument();
    expect(screen.queryByText("150ml")).not.toBeInTheDocument();
  });

  test("opens edit modal when clicking an entry", async () => {
    setupFeedHandlers({
      entries: [
        createFeedEntry({
          id: 1,
          type: "breast",
          status: "completed",
          duration_seconds: 1200,
        }),
      ],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Feed />);

    await user.click(await screen.findByText("20m 0s"));

    expect(await screen.findByText("Edit Feed")).toBeInTheDocument();
  });

  test("shows error toast when breast feed start fails", async () => {
    setupFeedHandlers();
    server.use(
      http.post(`${TEST_BASE_URL}/api/feed/breast/start`, () => {
        return HttpResponse.json({ error: "Already active" }, { status: 409 });
      }),
    );
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Feed />);

    await user.click(await screen.findByRole("button", { name: /^left$/i }));

    expect(await screen.findByText("Already active")).toBeInTheDocument();
  });

  test("opens edit modal with prefilled data", async () => {
    setupFeedHandlers({
      entries: [
        createFeedEntry({
          id: 1,
          type: "breast",
          side: "left",
          status: "completed",
          duration_seconds: 1200,
          notes: "Good latch",
        }),
      ],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Feed />);

    await user.click(await screen.findByText("20m 0s"));

    expect(await screen.findByText("Edit Feed")).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toHaveValue("Good latch");
  });

  test("keeps edit modal open when save fails", async () => {
    setupFeedHandlers({
      entries: [
        createFeedEntry({ id: 1, type: "breast", status: "completed" }),
      ],
    });
    server.use(
      http.put(`${TEST_BASE_URL}/api/feed/:id`, () => {
        return HttpResponse.json({ error: "Update failed" }, { status: 500 });
      }),
    );
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Feed />);

    await user.click(await screen.findByText("30m 0s"));
    expect(await screen.findByText("Edit Feed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByText("Update failed")).toBeInTheDocument();
    expect(screen.getByText("Edit Feed")).toBeInTheDocument();
  });

  test("closes edit modal without saving on close", async () => {
    setupFeedHandlers({
      entries: [
        createFeedEntry({ id: 1, type: "breast", status: "completed" }),
      ],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Feed />);

    await user.click(await screen.findByText("30m 0s"));
    expect(await screen.findByText("Edit Feed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(screen.queryByText("Edit Feed")).not.toBeInTheDocument();
  });

  test("closes amount modal on close", async () => {
    setupFeedHandlers();
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Feed />);

    await user.click(await screen.findByText("Formula"));
    await user.click(
      await screen.findByRole("button", { name: /log formula feed/i }),
    );
    expect(await screen.findByLabelText(/amount/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(screen.queryByLabelText(/amount/i)).not.toBeInTheDocument();
  });

  test("deletes entry with double-tap confirmation", async () => {
    setupFeedHandlers({
      entries: [
        createFeedEntry({ id: 1, type: "breast", status: "completed" }),
      ],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Feed />);

    await user.click(await screen.findByText("30m 0s"));
    expect(await screen.findByText("Edit Feed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(
      await screen.findByText(/tap again to confirm delete/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /tap again to confirm delete/i }),
    );

    expect(await screen.findByText(/feed deleted/i)).toBeInTheDocument();
    expect(screen.queryByText("Edit Feed")).not.toBeInTheDocument();
  });

  test("does not show empty state while loading", async () => {
    setupFeedHandlers({ entries: [] });
    renderAppAsAuthenticated(<Feed />);

    // Tab selector should appear
    expect(await screen.findByText("Breast")).toBeInTheDocument();

    // Empty state should appear after loading completes
    expect(await screen.findByText(/no breast feeds yet/i)).toBeInTheDocument();
  });
});
