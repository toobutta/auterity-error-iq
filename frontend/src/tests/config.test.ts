/**
 * Configuration test to verify vitest setup
 * Tests module resolution and basic functionality
 */

import { describe, it, expect, vi } from "vitest";

describe("Vitest Configuration", () => {
  it("should have vitest globals available", () => {
    expect(vi).toBeDefined();
    expect(describe).toBeDefined();
    expect(it).toBeDefined();
    expect(expect).toBeDefined();
  });

  it("should be able to create mocks", () => {
    const mockFn = vi.fn();
    mockFn("test");
    expect(mockFn).toHaveBeenCalledWith("test");
  });

  it("should handle async operations", async () => {
    const asyncFn = vi.fn().mockResolvedValue("success");
    const result = await asyncFn();
    expect(result).toBe("success");
  });

  it("should support timers", () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    setTimeout(callback, 1000);
    vi.advanceTimersByTime(1000);

    expect(callback).toHaveBeenCalled();
    vi.useRealTimers();
  });
});


