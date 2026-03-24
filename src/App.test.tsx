import { describe, test, expect } from "bun:test";
import { screen, render } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./store/slices/authSlice";
import dashboardReducer from "./store/slices/dashboardSlice";
import { ThemeProvider } from "./components/ThemeProvider";
import { ToastProvider } from "./components/ui/Toast";
import App from "./App";
import { server } from "./test/mocks/server";
import { TEST_BASE_URL } from "./test/global-setup";
import { TOKEN_KEY } from "../shared/constants";

function renderApp(
  route: string,
  authState?: {
    isLoading?: boolean;
    isAuthenticated?: boolean;
  },
) {
  if (authState?.isAuthenticated) {
    localStorage.setItem(TOKEN_KEY, "test-token");
  }

  const store = configureStore({
    reducer: {
      auth: authReducer,
      dashboard: dashboardReducer,
    },
    preloadedState: {
      auth: {
        isAuthenticated: authState?.isAuthenticated ?? false,
        isLoading: authState?.isLoading ?? false,
        error: null,
      },
    },
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <ThemeProvider>
          <MemoryRouter initialEntries={[route]}>
            <ToastProvider>
              <App />
            </ToastProvider>
          </MemoryRouter>
        </ThemeProvider>
      </Provider>,
    ),
  };
}

describe("App Route Guards", () => {
  describe("AuthGuard", () => {
    test("redirects to pin when unauthenticated", async () => {
      renderApp("/");

      expect(await screen.findByText(/enter your pin/i)).toBeInTheDocument();
    });

    test("shows loading spinner while checking auth", async () => {
      localStorage.setItem(TOKEN_KEY, "test-token");
      renderApp("/", {
        isLoading: true,
      });

      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    });

    test("fetches session check when token is present", async () => {
      server.use(
        http.get(`${TEST_BASE_URL}/api/auth/check`, () => {
          return HttpResponse.json({ data: { valid: true } });
        }),
      );

      localStorage.setItem(TOKEN_KEY, "test-token");
      renderApp("/", {
        isAuthenticated: false,
        isLoading: false,
      });

      expect(await screen.findByText(/last feed/i)).toBeInTheDocument();
    });

    test("redirects to pin when token is invalid", async () => {
      server.use(
        http.get(`${TEST_BASE_URL}/api/auth/check`, () => {
          return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
        }),
      );

      localStorage.setItem(TOKEN_KEY, "bad-token");
      renderApp("/", {
        isAuthenticated: false,
        isLoading: false,
      });

      expect(await screen.findByText(/enter your pin/i)).toBeInTheDocument();
    });
  });

  describe("Public Routes", () => {
    test("pin page is accessible without authentication", async () => {
      renderApp("/pin");

      expect(await screen.findByText(/enter your pin/i)).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });
});
