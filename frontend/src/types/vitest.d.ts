/// <reference types="vitest/globals" />

import { vi } from "vitest";

declare global {
  const vi: typeof import("vitest").vi;
}

export {};


