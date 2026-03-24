import React from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../store/slices/authSlice";
import dashboardReducer from "../store/slices/dashboardSlice";
import { ThemeProvider } from "../components/ThemeProvider";
import { ToastProvider } from "../components/ui/Toast";
import { TOKEN_KEY } from "../../shared/constants";

function createTestStore(
  preloadedState?: Parameters<typeof configureStore>[0]["preloadedState"],
) {
  return configureStore({
    reducer: {
      auth: authReducer,
      dashboard: dashboardReducer,
    },
    preloadedState,
  });
}

type Store = ReturnType<typeof createTestStore>;

type RenderAppResult = ReturnType<typeof render> & { store: Store };

type RenderRouteOptions = {
  route?: string;
  path?: string;
};

type RenderRouteResult = ReturnType<typeof render> & { store: Store };

export function renderApp(ui: React.ReactElement): RenderAppResult {
  const store = createTestStore();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <ThemeProvider>
          <MemoryRouter initialEntries={["/"]}>
            <ToastProvider>{children}</ToastProvider>
          </MemoryRouter>
        </ThemeProvider>
      </Provider>
    );
  }

  const result = render(ui, { wrapper: Wrapper });
  return Object.assign(result, { store });
}

export function renderRoute(
  ui: React.ReactElement,
  { route = "/", path = "/" }: RenderRouteOptions = {},
): RenderRouteResult {
  const store = createTestStore();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <ThemeProvider>
          <MemoryRouter initialEntries={[route]}>
            <ToastProvider>{children}</ToastProvider>
          </MemoryRouter>
        </ThemeProvider>
      </Provider>
    );
  }

  const result = render(
    <Routes>
      <Route path={path} element={ui} />
    </Routes>,
    { wrapper: Wrapper },
  );

  return Object.assign(result, { store });
}

export function renderAppAsAuthenticated(
  ui: React.ReactElement,
): RenderAppResult {
  localStorage.setItem(TOKEN_KEY, "test-token");

  const store = createTestStore({
    auth: {
      isAuthenticated: true,
      isLoading: false,
      error: null,
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <ThemeProvider>
          <MemoryRouter initialEntries={["/"]}>
            <ToastProvider>{children}</ToastProvider>
          </MemoryRouter>
        </ThemeProvider>
      </Provider>
    );
  }

  const result = render(ui, { wrapper: Wrapper });
  return Object.assign(result, { store });
}

export function renderRouteAsAuthenticated(
  ui: React.ReactElement,
  { route = "/", path = "/" }: RenderRouteOptions = {},
): RenderRouteResult {
  localStorage.setItem(TOKEN_KEY, "test-token");

  const store = createTestStore({
    auth: {
      isAuthenticated: true,
      isLoading: false,
      error: null,
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <ThemeProvider>
          <MemoryRouter initialEntries={[route]}>
            <ToastProvider>{children}</ToastProvider>
          </MemoryRouter>
        </ThemeProvider>
      </Provider>
    );
  }

  const result = render(
    <Routes>
      <Route path={path} element={ui} />
    </Routes>,
    { wrapper: Wrapper },
  );

  return Object.assign(result, { store });
}

export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
