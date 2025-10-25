import "@testing-library/jest-dom";

// Mock localStorage
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Provide a Jest compatibility layer for tests written with jest globals
// Map common jest APIs to vitest
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const jestShim: any = vi;
jestShim.fn = vi.fn;
jestShim.spyOn = vi.spyOn;
jestShim.mock = vi.mock;
jestShim.unmock = vi.unmock;
jestShim.useFakeTimers = vi.useFakeTimers;
jestShim.useRealTimers = vi.useRealTimers;
jestShim.setSystemTime = vi.setSystemTime;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).jest = jestShim;

// Mock window.location
Object.defineProperty(window, "location", {
  value: {
    href: "http://localhost:3000",
    origin: "http://localhost:3000",
    pathname: "/",
    search: "",
    hash: "",
  },
  writable: true,
});


