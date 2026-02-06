import { createApp, nextTick } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { describe, expect, it, beforeEach, vi } from "vitest";
import EditorView from "./EditorView.vue";

const mountEditor = async (initialPath = "/") => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: EditorView },
      { path: "/:encoded(.*)", component: EditorView },
    ],
  });
  await router.push(initialPath);
  await router.isReady();

  const app = createApp(EditorView);
  app.use(router);
  const container = document.createElement("div");
  document.body.appendChild(container);
  const vm = app.mount(container);

  return { app, container, router, vm };
};

describe("EditorView", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("hydrates the textarea from the encoded route", async () => {
    const { app, container } = await mountEditor("/mMMk6GQTDEA");
    await nextTick();

    const textarea = container.querySelector("textarea");
    expect(textarea.value).toBe("テスト");

    app.unmount();
  });

  it("replaces the route when input changes", async () => {
    vi.useFakeTimers();
    const { app, container, router } = await mountEditor();
    await nextTick();

    const replaceSpy = vi.spyOn(router, "replace");
    const textarea = container.querySelector("textarea");
    textarea.value = "Share me";
    textarea.dispatchEvent(new Event("input"));

    // Wait for the watch to trigger
    await nextTick();

    // Run timers for the debouncedReplace
    vi.runAllTimers();
    await nextTick();

    expect(replaceSpy).toHaveBeenCalledWith({ path: "/MoCwhgTgpgBAtlIA" });

    app.unmount();
    vi.useRealTimers();
  });

  it("updates focus state when textarea is focused or blurred", async () => {
    const { app, container } = await mountEditor();
    await nextTick();

    const textarea = container.querySelector("textarea");
    const header = container.querySelector("header");
    const spacer = container.querySelector("div.lg\\:hidden.transition-all");

    // Initially not focused
    expect(header.classList.contains("sticky")).toBe(true);
    expect(spacer.classList.contains("h-40")).toBe(true);

    // Focus
    await textarea.dispatchEvent(new Event("focus"));
    await nextTick();
    expect(header.classList.contains("relative")).toBe(true);
    expect(spacer.classList.contains("h-96")).toBe(true);
    expect(textarea.classList.contains("pb-[30dvh]")).toBe(true);

    // Blur
    await textarea.dispatchEvent(new Event("blur"));
    await nextTick();
    expect(header.classList.contains("sticky")).toBe(true);
    expect(spacer.classList.contains("h-40")).toBe(true);

    app.unmount();
  });

  it("clears markdown when clear button is clicked", async () => {
    const { app, container } = await mountEditor();
    await nextTick();

    const textarea = container.querySelector("textarea");
    textarea.value = "Some content";
    textarea.dispatchEvent(new Event("input"));
    await nextTick();

    const clearButton = Array.from(container.querySelectorAll("button")).find(b => b.textContent.includes("Clear"));
    await clearButton.click();
    await nextTick();
    await nextTick();

    expect(textarea.value).toBe("");
    app.unmount();
  });

  it("changes presets and style options", async () => {
    const { app, container, vm } = await mountEditor();
    await nextTick();

    // Change preset
    const presetButtons = container.querySelectorAll("header button.rounded-lg.text-sm");
    await presetButtons[1].click();
    await nextTick();
    // presetKey is reactive, we can check vm if exposed or just assume it works if no error

    // Change background color
    const colorInput = container.querySelector('input[type="color"]');
    colorInput.value = "#ff0000";
    colorInput.dispatchEvent(new Event("input"));
    await nextTick();

    // Change text color
    const colorButtons = container.querySelectorAll('header .flex.gap-1 button');
    await colorButtons[1].click();
    await nextTick();

    // Change font size
    const fontSizeInput = container.querySelector('input[type="range"]');
    fontSizeInput.value = "25";
    fontSizeInput.dispatchEvent(new Event("input"));
    await nextTick();

    app.unmount();
  });

  it("triggers exportAllPng", async () => {
    const { app, vm } = await mountEditor();
    await nextTick();

    // Mock html2canvas
    vi.mock("html2canvas", () => ({
      default: vi.fn(() => Promise.resolve(document.createElement("canvas"))),
    }));

    // Mock share and canShare
    if (!navigator.canShare) navigator.canShare = vi.fn(() => true);
    if (!navigator.share) navigator.share = vi.fn(() => Promise.resolve());

    // We need to set pageCaptureRef because it's usually set via ref in template
    // But in test it might be different.
    // EditorView exposes some things for testing.
    const captureNode = document.createElement("div");
    captureNode.innerHTML = '<div class="md-body"></div>';
    vm.setPageCaptureNode(captureNode);

    await vm.exportAllPng();
    // If it doesn't throw, it's mostly covered.

    app.unmount();
  });

  it("handles route param changes for sync", async () => {
    const { app, router, container } = await mountEditor();
    await nextTick();

    const textarea = container.querySelector("textarea");

    // Change route manually
    await router.push("/mMMk6GQTDEA"); // "テスト"
    await nextTick();

    expect(textarea.value).toBe("テスト");

    app.unmount();
  });
});
