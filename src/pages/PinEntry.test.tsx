import { describe, test, expect } from "bun:test";
import { http, HttpResponse } from "msw";
import { renderApp, screen, userEvent } from "../test/utils";
import PinEntry from "./PinEntry";
import { server } from "../test/mocks/server";
import { TEST_BASE_URL } from "../test/global-setup";

function filledDotCount() {
  const dotsContainer = screen.getByTestId("pin-dots");
  return dotsContainer.querySelectorAll("[data-filled='true']").length;
}

describe("PinEntry", () => {
  test("renders PIN pad with all digits", () => {
    renderApp(<PinEntry />);

    for (let i = 0; i <= 9; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument();
    }
    expect(screen.getByText(/enter your pin/i)).toBeInTheDocument();
  });

  test("shows PIN dots that fill as digits are entered", async () => {
    const user = userEvent.setup();
    renderApp(<PinEntry />);

    await user.click(screen.getByText("1"));
    await user.click(screen.getByText("2"));

    expect(filledDotCount()).toBe(2);
  });

  test("auto-submits after 4 digits", async () => {
    const user = userEvent.setup();
    renderApp(<PinEntry />);

    await user.click(screen.getByText("1"));
    await user.click(screen.getByText("2"));
    await user.click(screen.getByText("3"));
    await user.click(screen.getByText("4"));

    // Verification triggers — on success the PIN clears
    expect(filledDotCount()).toBe(4);
  });

  test("shows error message on invalid PIN", async () => {
    server.use(
      http.post(`${TEST_BASE_URL}/api/auth/verify`, () => {
        return HttpResponse.json({ error: "Invalid PIN" }, { status: 401 });
      }),
    );

    const user = userEvent.setup();
    renderApp(<PinEntry />);

    await user.click(screen.getByText("0"));
    await user.click(screen.getByText("0"));
    await user.click(screen.getByText("0"));
    await user.click(screen.getByText("0"));

    expect(await screen.findByText(/invalid pin/i)).toBeInTheDocument();
  });

  test("delete button removes last digit", async () => {
    const user = userEvent.setup();
    renderApp(<PinEntry />);

    await user.click(screen.getByText("1"));
    await user.click(screen.getByText("2"));

    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(filledDotCount()).toBe(1);
  });
});
