import { createApp, nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App.vue";
import html2canvas from "html2canvas";
import { marked } from "marked";
import { paginateHtml } from "./lib/pagination";
import { uiText } from "./lib/uiText";

vi.mock("html2canvas", () => ({ default: vi.fn() }));
vi.mock("marked", () => ({ marked: { parse: vi.fn() } }));
vi.mock("./lib/pagination", () => ({ paginateHtml: vi.fn() }));

const createCanvas = (blob) => ({
  toBlob: (callback) => callback(blob),
});

const setNavigator = (overrides) => {
  Object.defineProperty(globalThis, "navigator", {
    value: {
      userAgent: "Mozilla/5.0",
      ...overrides,
    },
    configurable: true,
  });
};

describe("App", () => {
  let originalNavigator;
  let container;

  beforeEach(() => {
    originalNavigator = globalThis.navigator;
    marked.parse.mockReturnValue("<p>Rendered</p>");
    paginateHtml.mockReturnValue(["<p>Page</p>"]);
    setNavigator({});
    container = document.createElement("div");
    document.body.appendChild(container);
    if (!URL.createObjectURL) {
      URL.createObjectURL = () => "blob:mock";
    }
    if (!URL.revokeObjectURL) {
      URL.revokeObjectURL = () => {};
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      configurable: true,
    });
    delete document.fonts;
    container.remove();
  });

  const mountApp = () => {
    const app = createApp(App);
    const vm = app.mount(container);
    return { app, vm };
  };

  const waitForPaginate = async () => {
    await nextTick();
    await nextTick();
  };

  it("renders header text and page count", async () => {
    paginateHtml.mockReturnValue(["<p>A</p>", "<p>B</p>"]);

    const { app } = mountApp();
    await waitForPaginate();

    expect(container.textContent).toContain(uiText.previewLabel);
    expect(container.textContent).toContain(uiText.pageCountLabel(2));

    app.unmount();
  });

  it("debounces pagination when markdown changes", async () => {
    vi.useFakeTimers();
    const { app } = mountApp();
    await waitForPaginate();

    paginateHtml.mockClear();
    const textarea = container.querySelector("textarea");
    textarea.value = "# Updated";
    textarea.dispatchEvent(new Event("input"));
    expect(paginateHtml).not.toHaveBeenCalled();

    vi.runAllTimers();
    await nextTick();

    expect(paginateHtml).toHaveBeenCalled();
    app.unmount();
    vi.useRealTimers();
  });

  it("returns early when measurement refs are missing", async () => {
    const { app, vm } = mountApp();
    await waitForPaginate();

    paginateHtml.mockClear();
    vm.measureWrapRef = null;
    vm.measureContentRef = null;
    await vm.paginate();

    expect(paginateHtml).not.toHaveBeenCalled();
    app.unmount();
  });

  it("shares a single image on mobile devices when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    setNavigator({
      userAgent: "iPhone",
      canShare,
      share,
    });
    document.fonts = { ready: Promise.resolve() };

    html2canvas.mockResolvedValue(createCanvas(new Blob(["data"], { type: "image/png" })));

    const { app, vm } = mountApp();
    await waitForPaginate();

    await vm.exportAllPng();

    expect(canShare).toHaveBeenCalled();
    expect(share).toHaveBeenCalled();
    app.unmount();
  });

  it("falls back to sequential downloads when sharing fails", async () => {
    const share = vi.fn().mockRejectedValue(new Error("share failed"));
    const canShare = vi.fn().mockReturnValue(true);
    setNavigator({
      userAgent: "Android",
      canShare,
      share,
    });
    paginateHtml.mockReturnValue(["<p>A</p>", "<p>B</p>"]);

    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    html2canvas.mockResolvedValue(createCanvas(new Blob(["data"], { type: "image/png" })));

    const { app, vm } = mountApp();
    await waitForPaginate();

    await vm.exportAllPng();

    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(clickSpy).toHaveBeenCalledTimes(2);
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);

    app.unmount();
  });

  it("downloads a single image when sharing is unavailable", async () => {
    setNavigator({ userAgent: "Desktop" });

    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock");
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    html2canvas.mockResolvedValue(createCanvas(new Blob(["data"], { type: "image/png" })));

    const { app, vm } = mountApp();
    await waitForPaginate();

    await vm.exportAllPng();

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    app.unmount();
  });

  it("skips null blobs without downloading", async () => {
    html2canvas.mockResolvedValue(createCanvas(null));
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock");

    const { app, vm } = mountApp();
    await waitForPaginate();

    await vm.exportAllPng();

    expect(createObjectURL).not.toHaveBeenCalled();
    app.unmount();
  });

  it("exits export early when the capture node is missing", async () => {
    html2canvas.mockResolvedValue(createCanvas(new Blob(["data"], { type: "image/png" })));
    const { app, vm } = mountApp();
    await waitForPaginate();

    vm.$.setupState.pageCaptureRef.value = null;
    await vm.exportAllPng();

    expect(html2canvas).not.toHaveBeenCalled();
    app.unmount();
  });

  it("resets to full HTML when no pages are available", async () => {
    paginateHtml.mockReturnValue([]);
    const { app, vm } = mountApp();
    await waitForPaginate();

    vm.pagesHtml = [];
    await vm.exportAllPng();

    const preview = container.querySelector(".md-body");
    expect(preview.innerHTML).toContain("Rendered");

    app.unmount();
  });
});
