import { describe, expect, it, vi } from "vitest";
import { createDebounce } from "./timing";

describe("createDebounce", () => {
  it("delays execution until after the wait time", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = createDebounce(fn, 100);

    debounced("a");
    debounced("b");

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("b");
    vi.useRealTimers();
  });

  it("supports canceling", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = createDebounce(fn, 50);

    debounced();
    debounced.cancel();
    vi.advanceTimersByTime(60);

    expect(fn).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("throws when fn is not a function", () => {
    expect(() => createDebounce(null, 10)).toThrow("fn");
  });
});
