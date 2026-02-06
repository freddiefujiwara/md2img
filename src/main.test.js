import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const mount = vi.fn();
const use = vi.fn(() => ({ mount }));
const createApp = vi.fn(() => ({ use, mount }));

vi.mock("vue", () => ({ createApp }));
vi.mock("./App.vue", () => ({ default: { name: "App" } }));
vi.mock("./router", () => ({ default: { name: "router" } }));

describe("main", () => {
  let originalLocation;
  let originalHistory;

  beforeEach(() => {
    vi.resetModules();
    originalLocation = window.location;
    originalHistory = window.history;
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      configurable: true,
    });
    Object.defineProperty(window, "history", {
      value: originalHistory,
      configurable: true,
    });
  });

  it("mounts the app on #app", async () => {
    await import("./main.js");

    expect(createApp).toHaveBeenCalledWith({ name: "App" });
    expect(use).toHaveBeenCalledWith({ name: "router" });
    expect(mount).toHaveBeenCalledWith("#app");
  });

  it("rewrites spa redirect query params before mounting", async () => {
    const replaceState = vi.fn();
    Object.defineProperty(window, "history", {
      value: { replaceState },
      configurable: true,
    });
    Object.defineProperty(window, "location", {
      value: {
        search: "?p=share%20text",
        hash: "#preview",
      },
      configurable: true,
    });

    await import("./main.js?redirect");

    expect(replaceState).toHaveBeenCalled();
  });

  it("rewrites spa redirect path marker before mounting", async () => {
    const replaceState = vi.fn();
    Object.defineProperty(window, "history", {
      value: { replaceState },
      configurable: true,
    });
    Object.defineProperty(window, "location", {
      value: {
        search: "?/share%20text&mode=1",
        hash: "#preview",
      },
      configurable: true,
    });

    await import("./main.js?redirect-path");

    expect(replaceState).toHaveBeenCalled();
  });

  it("does nothing if search is empty", async () => {
    Object.defineProperty(window, "location", {
      value: {
        search: "",
        hash: "",
      },
      configurable: true,
    });

    await import("./main.js?no-search");
    // Should just not throw
  });
});
