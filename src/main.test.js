import { describe, expect, it, vi } from "vitest";

const mount = vi.fn();
const createApp = vi.fn(() => ({ mount }));

vi.mock("vue", () => ({ createApp }));
vi.mock("./App.vue", () => ({ default: { name: "App" } }));

describe("main", () => {
  it("mounts the app on #app", async () => {
    await import("./main.js");

    expect(createApp).toHaveBeenCalledWith({ name: "App" });
    expect(mount).toHaveBeenCalledWith("#app");
  });
});
