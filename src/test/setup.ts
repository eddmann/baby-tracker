import { localStorageFake } from "./global-setup";
import { afterAll, afterEach, beforeAll, beforeEach } from "bun:test";
import { resetIdCounter } from "./fixtures";
import { configure } from "@testing-library/react";
import "@testing-library/jest-dom";
import { server } from "./mocks/server";

configure({
  asyncUtilTimeout: 5000,
});

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

beforeEach(() => {
  resetIdCounter();
});

afterEach(() => {
  server.resetHandlers();
  localStorageFake.clear();
  document.body.innerHTML = "";
});

afterAll(() => {
  server.close();
});
