import { describe, test, expect } from "bun:test";
import { http, HttpResponse } from "msw";
import { renderAppAsAuthenticated, screen, userEvent } from "../test/utils";
import { server } from "../test/mocks/server";
import { TEST_BASE_URL } from "../test/global-setup";
import DailyTasks from "./DailyTasks";

interface TaskWithStatus {
  id: number;
  name: string;
  frequency_days: number;
  start_date: string | null;
  is_due: boolean;
  is_completed_today: boolean;
  last_completed_at: string | null;
  next_due_date: string | null;
}

function createTask(overrides?: Partial<TaskWithStatus>): TaskWithStatus {
  return {
    id: 1,
    name: "Vitamin D",
    frequency_days: 1,
    start_date: null,
    is_due: true,
    is_completed_today: false,
    last_completed_at: null,
    next_due_date: null,
    ...overrides,
  };
}

function setupDailyTasksHandlers(options?: { tasks?: TaskWithStatus[] }) {
  const tasks = options?.tasks ?? [createTask()];

  server.use(
    http.get(`${TEST_BASE_URL}/api/daily-tasks`, () => {
      return HttpResponse.json({ data: { tasks } });
    }),
  );
}

describe("DailyTasks", () => {
  test("shows due tasks and completed tasks in sections", async () => {
    setupDailyTasksHandlers({
      tasks: [
        createTask({
          id: 1,
          name: "Vitamin D",
          is_due: true,
          is_completed_today: false,
        }),
        createTask({
          id: 2,
          name: "Tummy time",
          is_due: true,
          is_completed_today: true,
        }),
      ],
    });
    renderAppAsAuthenticated(<DailyTasks />);

    expect(await screen.findByText("Due today")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("Vitamin D")).toBeInTheDocument();
    expect(screen.getByText("Tummy time")).toBeInTheDocument();
  });

  test("shows empty state when no tasks", async () => {
    setupDailyTasksHandlers({ tasks: [] });
    renderAppAsAuthenticated(<DailyTasks />);

    expect(await screen.findByText(/no tasks yet/i)).toBeInTheDocument();
    expect(
      screen.getByText(/tap add to create your first recurring task/i),
    ).toBeInTheDocument();
  });

  test("completes a due task", async () => {
    setupDailyTasksHandlers({
      tasks: [createTask({ id: 1, name: "Vitamin D", is_due: true })],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<DailyTasks />);

    await user.click(
      await screen.findByRole("button", { name: /complete vitamin d/i }),
    );

    // The page refreshes after completing
    expect(await screen.findByText("Vitamin D")).toBeInTheDocument();
  });

  test("uncompletes a completed task", async () => {
    setupDailyTasksHandlers({
      tasks: [
        createTask({
          id: 1,
          name: "Vitamin D",
          is_due: true,
          is_completed_today: true,
        }),
      ],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<DailyTasks />);

    await user.click(
      await screen.findByRole("button", { name: /uncomplete vitamin d/i }),
    );

    expect(await screen.findByText("Vitamin D")).toBeInTheDocument();
  });

  test("opens add modal and creates a task", async () => {
    setupDailyTasksHandlers({ tasks: [] });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<DailyTasks />);

    await user.click(await screen.findByText("Add"));
    await user.type(await screen.findByLabelText(/task name/i), "Bath time");
    await user.click(screen.getByRole("button", { name: /add task/i }));

    expect(await screen.findByText(/task created/i)).toBeInTheDocument();
  });

  test("opens edit modal when clicking a task", async () => {
    setupDailyTasksHandlers({
      tasks: [createTask({ id: 1, name: "Vitamin D", is_due: true })],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<DailyTasks />);

    await user.click(await screen.findByText("Vitamin D"));

    expect(await screen.findByText("Edit Task")).toBeInTheDocument();
  });

  test("shows error toast when complete fails", async () => {
    setupDailyTasksHandlers({
      tasks: [createTask({ id: 1, name: "Vitamin D", is_due: true })],
    });
    server.use(
      http.post(`${TEST_BASE_URL}/api/daily-tasks/:id/complete`, () => {
        return HttpResponse.json({ error: "Complete failed" }, { status: 500 });
      }),
    );
    const user = userEvent.setup();
    renderAppAsAuthenticated(<DailyTasks />);

    await user.click(
      await screen.findByRole("button", { name: /complete vitamin d/i }),
    );

    expect(await screen.findByText("Complete failed")).toBeInTheDocument();
  });

  test("shows upcoming tasks section", async () => {
    setupDailyTasksHandlers({
      tasks: [
        createTask({
          id: 1,
          name: "Weekly bath",
          frequency_days: 7,
          is_due: false,
          is_completed_today: false,
          next_due_date: "2026-03-25",
        }),
      ],
    });
    renderAppAsAuthenticated(<DailyTasks />);

    expect(await screen.findByText("Upcoming")).toBeInTheDocument();
    expect(screen.getByText("Weekly bath")).toBeInTheDocument();
  });

  test("opens edit modal with prefilled data", async () => {
    setupDailyTasksHandlers({
      tasks: [
        createTask({
          id: 1,
          name: "Vitamin D",
          frequency_days: 1,
          is_due: true,
        }),
      ],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<DailyTasks />);

    await user.click(await screen.findByText("Vitamin D"));

    expect(await screen.findByText("Edit Task")).toBeInTheDocument();
    expect(screen.getByLabelText(/task name/i)).toHaveValue("Vitamin D");
    expect(screen.getByLabelText(/frequency/i)).toHaveValue(1);
  });

  test("keeps edit modal open when save fails", async () => {
    setupDailyTasksHandlers({
      tasks: [createTask({ id: 1, name: "Vitamin D", is_due: true })],
    });
    server.use(
      http.put(`${TEST_BASE_URL}/api/daily-tasks/:id`, () => {
        return HttpResponse.json({ error: "Update failed" }, { status: 500 });
      }),
    );
    const user = userEvent.setup();
    renderAppAsAuthenticated(<DailyTasks />);

    await user.click(await screen.findByText("Vitamin D"));
    expect(await screen.findByText("Edit Task")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByText("Update failed")).toBeInTheDocument();
    expect(screen.getByText("Edit Task")).toBeInTheDocument();
  });

  test("closes add modal without saving on close", async () => {
    setupDailyTasksHandlers({ tasks: [] });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<DailyTasks />);

    await user.click(await screen.findByText("Add"));
    expect(await screen.findByText("New Task")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(screen.queryByText("New Task")).not.toBeInTheDocument();
  });

  test("keeps add modal open when create fails", async () => {
    setupDailyTasksHandlers({ tasks: [] });
    server.use(
      http.post(`${TEST_BASE_URL}/api/daily-tasks`, () => {
        return HttpResponse.json({ error: "Create failed" }, { status: 500 });
      }),
    );
    const user = userEvent.setup();
    renderAppAsAuthenticated(<DailyTasks />);

    await user.click(await screen.findByText("Add"));
    await user.type(await screen.findByLabelText(/task name/i), "Bath time");
    await user.click(screen.getByRole("button", { name: /add task/i }));

    expect(await screen.findByText("Create failed")).toBeInTheDocument();
    expect(screen.getByText("New Task")).toBeInTheDocument();
  });

  test("deletes task with double-tap confirmation", async () => {
    setupDailyTasksHandlers({
      tasks: [createTask({ id: 1, name: "Vitamin D", is_due: true })],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<DailyTasks />);

    await user.click(await screen.findByText("Vitamin D"));
    expect(await screen.findByText("Edit Task")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(
      await screen.findByText(/tap again to confirm delete/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /tap again to confirm delete/i }),
    );

    expect(await screen.findByText(/task deleted/i)).toBeInTheDocument();
    expect(screen.queryByText("Edit Task")).not.toBeInTheDocument();
  });

  test("does not show empty state while loading", async () => {
    setupDailyTasksHandlers({ tasks: [] });
    renderAppAsAuthenticated(<DailyTasks />);

    // Add button appears in header immediately
    expect(await screen.findByText("Add")).toBeInTheDocument();

    // Empty state appears after loading
    expect(await screen.findByText(/no tasks yet/i)).toBeInTheDocument();
  });
});
