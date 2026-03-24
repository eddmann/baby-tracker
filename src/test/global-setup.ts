import { JSDOM } from "jsdom";

const dom = new JSDOM(
  "<!DOCTYPE html><html><head></head><body></body></html>",
  {
    url: "http://localhost:3000",
    pretendToBeVisual: true,
  },
);

if (typeof process !== "undefined" && !process.env.NODE_ENV) {
  process.env.NODE_ENV = "test";
}

globalThis.window = dom.window as unknown as Window & typeof globalThis;
globalThis.document = dom.window.document;
globalThis.navigator = dom.window.navigator;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Element = dom.window.Element;
globalThis.DocumentFragment = dom.window.DocumentFragment;
globalThis.Node = dom.window.Node;
globalThis.Text = dom.window.Text;
globalThis.Comment = dom.window.Comment;
globalThis.HTMLInputElement = dom.window.HTMLInputElement;
globalThis.HTMLButtonElement = dom.window.HTMLButtonElement;
globalThis.HTMLFormElement = dom.window.HTMLFormElement;
globalThis.HTMLLabelElement = dom.window.HTMLLabelElement;
globalThis.HTMLAnchorElement = dom.window.HTMLAnchorElement;
globalThis.HTMLDivElement = dom.window.HTMLDivElement;
globalThis.HTMLSpanElement = dom.window.HTMLSpanElement;
globalThis.HTMLImageElement = dom.window.HTMLImageElement;
globalThis.SVGElement = dom.window.SVGElement;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.KeyboardEvent = dom.window.KeyboardEvent;
globalThis.Event = dom.window.Event;
globalThis.CustomEvent = dom.window.CustomEvent;
globalThis.MutationObserver = dom.window.MutationObserver;
globalThis.getComputedStyle = dom.window.getComputedStyle;

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverMock;

// Fake localStorage
const localStorageFake = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageFake });
globalThis.localStorage = localStorageFake as unknown as Storage;

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
  const id = setTimeout(() => callback(Date.now()), 0);
  return Number(id);
};
globalThis.cancelAnimationFrame = (id: number) => {
  clearTimeout(id as unknown as number);
};
window.requestAnimationFrame = globalThis.requestAnimationFrame;
window.cancelAnimationFrame = globalThis.cancelAnimationFrame;

type SupportedValuesKey = Parameters<
  NonNullable<typeof Intl.supportedValuesOf>
>[0];
const originalSupportedValuesOf = Intl.supportedValuesOf?.bind(Intl);
Intl.supportedValuesOf = (key: SupportedValuesKey) => {
  if (key === "timeZone") {
    return ["UTC"];
  }
  return originalSupportedValuesOf ? originalSupportedValuesOf(key) : [];
};

if (typeof Element !== "undefined") {
  Element.prototype.scrollIntoView = () => {};
}

export { dom, localStorageFake };
export const TEST_BASE_URL = "http://localhost:3000";
