import { describe, test, expect } from "bun:test";
import { http, HttpResponse } from "msw";
import { renderAppAsAuthenticated, screen, userEvent } from "../test/utils";
import { server } from "../test/mocks/server";
import { TEST_BASE_URL } from "../test/global-setup";
import { createGrowthEntry } from "../test/fixtures";
import Growth from "./Growth";

function setupGrowthHandlers(options?: {
  entries?: ReturnType<typeof createGrowthEntry>[];
}) {
  const entries = options?.entries ?? [createGrowthEntry({ id: 1 })];

  server.use(
    http.get(`${TEST_BASE_URL}/api/growth`, () => {
      return HttpResponse.json({ data: { entries } });
    }),
  );
}

describe("Growth", () => {
  test("shows entries with weight in kg", async () => {
    setupGrowthHandlers({
      entries: [
        createGrowthEntry({
          id: 1,
          weight_grams: 4300,
          measured_at: "2026-03-26T09:30:00.000Z",
        }),
      ],
    });
    renderAppAsAuthenticated(<Growth />);

    expect(await screen.findByText(/4\.30/)).toBeInTheDocument();
    expect(screen.getByText("kg")).toBeInTheDocument();
  });

  test("shows entries with height in cm", async () => {
    setupGrowthHandlers({
      entries: [
        createGrowthEntry({
          id: 1,
          weight_grams: null,
          height_mm: 520,
          measured_at: "2026-03-26T09:30:00.000Z",
        }),
      ],
    });
    renderAppAsAuthenticated(<Growth />);

    expect(await screen.findByText(/52\.0/)).toBeInTheDocument();
    expect(screen.getByText("cm")).toBeInTheDocument();
  });

  test("shows lbs conversion", async () => {
    setupGrowthHandlers({
      entries: [
        createGrowthEntry({
          id: 1,
          weight_grams: 4300,
          measured_at: "2026-03-26T09:30:00.000Z",
        }),
      ],
    });
    renderAppAsAuthenticated(<Growth />);

    expect(await screen.findByText(/9\.5lbs/)).toBeInTheDocument();
  });

  test("shows empty state when no entries", async () => {
    setupGrowthHandlers({ entries: [] });
    renderAppAsAuthenticated(<Growth />);

    expect(
      await screen.findByText(/no growth entries yet/i),
    ).toBeInTheDocument();
  });

  test("opens add modal via FAB", async () => {
    setupGrowthHandlers({ entries: [] });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Growth />);

    await user.click(await screen.findByText("Add"));

    expect(await screen.findByText("Log Measurement")).toBeInTheDocument();
    expect(screen.getByLabelText(/weight/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/height/i)).toBeInTheDocument();
  });

  test("logs a weight entry and shows success toast", async () => {
    setupGrowthHandlers({ entries: [] });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Growth />);

    await user.click(await screen.findByText("Add"));
    await user.type(await screen.findByLabelText(/weight/i), "4.30");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByText(/growth entry logged/i)).toBeInTheDocument();
  });

  test("save button is disabled when both fields are empty", async () => {
    setupGrowthHandlers({ entries: [] });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Growth />);

    await user.click(await screen.findByText("Add"));

    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();
  });

  test("shows error toast when log fails", async () => {
    setupGrowthHandlers({ entries: [] });
    server.use(
      http.post(`${TEST_BASE_URL}/api/growth`, () => {
        return HttpResponse.json({ error: "Server error" }, { status: 500 });
      }),
    );
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Growth />);

    await user.click(await screen.findByText("Add"));
    await user.type(await screen.findByLabelText(/weight/i), "4.30");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByText("Server error")).toBeInTheDocument();
  });

  test("opens edit modal when clicking an entry", async () => {
    setupGrowthHandlers({
      entries: [
        createGrowthEntry({
          id: 1,
          weight_grams: 4300,
          measured_at: "2026-03-26T09:30:00.000Z",
        }),
      ],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Growth />);

    await user.click(await screen.findByText(/4\.30/));

    expect(await screen.findByText("Edit Growth")).toBeInTheDocument();
  });

  test("opens edit modal with prefilled weight", async () => {
    setupGrowthHandlers({
      entries: [
        createGrowthEntry({
          id: 1,
          weight_grams: 4300,
          measured_at: "2026-03-26T09:30:00.000Z",
        }),
      ],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Growth />);

    await user.click(await screen.findByText(/4\.30/));

    expect(await screen.findByText("Edit Growth")).toBeInTheDocument();
    expect(screen.getByLabelText(/weight/i)).toHaveValue(4.3);
  });

  test("saves edited weight and shows success toast", async () => {
    setupGrowthHandlers({
      entries: [
        createGrowthEntry({
          id: 1,
          weight_grams: 4300,
          measured_at: "2026-03-26T09:30:00.000Z",
        }),
      ],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Growth />);

    await user.click(await screen.findByText(/4\.30/));
    expect(await screen.findByText("Edit Growth")).toBeInTheDocument();

    const weightInput = screen.getByLabelText(/weight/i);
    await user.clear(weightInput);
    await user.type(weightInput, "4.50");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(
      await screen.findByText(/growth entry updated/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("Edit Growth")).not.toBeInTheDocument();
  });

  test("saves edited height and shows success toast", async () => {
    setupGrowthHandlers({
      entries: [
        createGrowthEntry({
          id: 1,
          weight_grams: null,
          height_mm: 520,
          measured_at: "2026-03-26T09:30:00.000Z",
        }),
      ],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Growth />);

    await user.click(await screen.findByText(/52\.0/));
    expect(await screen.findByText("Edit Growth")).toBeInTheDocument();

    const heightInput = screen.getByLabelText(/height/i);
    await user.clear(heightInput);
    await user.type(heightInput, "54.5");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(
      await screen.findByText(/growth entry updated/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("Edit Growth")).not.toBeInTheDocument();
  });

  test("saves edited weight and height together", async () => {
    setupGrowthHandlers({
      entries: [
        createGrowthEntry({
          id: 1,
          weight_grams: 4300,
          height_mm: 520,
          measured_at: "2026-03-26T09:30:00.000Z",
        }),
      ],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Growth />);

    await user.click(await screen.findByText(/4\.30/));
    expect(await screen.findByText("Edit Growth")).toBeInTheDocument();

    const weightInput = screen.getByLabelText(/weight/i);
    await user.clear(weightInput);
    await user.type(weightInput, "4.50");

    const heightInput = screen.getByLabelText(/height/i);
    await user.clear(heightInput);
    await user.type(heightInput, "55.0");

    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(
      await screen.findByText(/growth entry updated/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("Edit Growth")).not.toBeInTheDocument();
  });

  test("keeps edit modal open when save fails", async () => {
    setupGrowthHandlers({
      entries: [
        createGrowthEntry({
          id: 1,
          weight_grams: 4300,
          measured_at: "2026-03-26T09:30:00.000Z",
        }),
      ],
    });
    server.use(
      http.put(`${TEST_BASE_URL}/api/growth/:id`, () => {
        return HttpResponse.json({ error: "Update failed" }, { status: 500 });
      }),
    );
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Growth />);

    await user.click(await screen.findByText(/4\.30/));
    expect(await screen.findByText("Edit Growth")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByText("Update failed")).toBeInTheDocument();
    expect(screen.getByText("Edit Growth")).toBeInTheDocument();
  });

  test("closes edit modal without saving on close", async () => {
    setupGrowthHandlers({
      entries: [
        createGrowthEntry({
          id: 1,
          weight_grams: 4300,
          measured_at: "2026-03-26T09:30:00.000Z",
        }),
      ],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Growth />);

    await user.click(await screen.findByText(/4\.30/));
    expect(await screen.findByText("Edit Growth")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(screen.queryByText("Edit Growth")).not.toBeInTheDocument();
  });

  test("deletes entry with double-tap confirmation", async () => {
    setupGrowthHandlers({
      entries: [
        createGrowthEntry({
          id: 1,
          weight_grams: 4300,
          measured_at: "2026-03-26T09:30:00.000Z",
        }),
      ],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Growth />);

    await user.click(await screen.findByText(/4\.30/));
    expect(await screen.findByText("Edit Growth")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(
      await screen.findByText(/tap again to confirm delete/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /tap again to confirm delete/i }),
    );

    expect(
      await screen.findByText(/growth entry deleted/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("Edit Growth")).not.toBeInTheDocument();
  });

  test("shows notes in entry list", async () => {
    setupGrowthHandlers({
      entries: [
        createGrowthEntry({
          id: 1,
          weight_grams: 4300,
          notes: "Day 36 weigh-in",
          measured_at: "2026-03-26T09:30:00.000Z",
        }),
      ],
    });
    renderAppAsAuthenticated(<Growth />);

    expect(await screen.findByText("Day 36 weigh-in")).toBeInTheDocument();
  });

  test("shows both weight and height when present", async () => {
    setupGrowthHandlers({
      entries: [
        createGrowthEntry({
          id: 1,
          weight_grams: 4300,
          height_mm: 545,
          measured_at: "2026-03-26T09:30:00.000Z",
        }),
      ],
    });
    renderAppAsAuthenticated(<Growth />);

    expect(await screen.findByText(/4\.30/)).toBeInTheDocument();
    expect(screen.getByText(/54\.5/)).toBeInTheDocument();
  });
});
