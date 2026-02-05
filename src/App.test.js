import { createApp, nextTick } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EditorView from "./views/EditorView.vue";
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

describe("EditorView", () => {
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

  const mountApp = async (initialPath = "/") => {
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
    const vm = app.mount(container);
    return { app, vm, router };
  };

  const waitForPaginate = async () => {
    await nextTick();
    await nextTick();
  };

  it("renders header text and page count", async () => {
    paginateHtml.mockReturnValue(["<p>A</p>", "<p>B</p>"]);

    const { app } = await mountApp();
    await waitForPaginate();

    expect(container.textContent).toContain(uiText.previewLabel);
    expect(container.textContent).toContain(uiText.pageCountLabel(2));

    app.unmount();
  });

  it("debounces pagination when markdown changes", async () => {
    vi.useFakeTimers();
    const { app } = await mountApp();
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

  it("hydrates markdown from the encoded route", async () => {
    const { app } = await mountApp("/%E3%83%86%E3%82%B9%E3%83%88");
    await waitForPaginate();

    const textarea = container.querySelector("textarea");
    expect(textarea.value).toBe("テスト");

    app.unmount();
  });

  it("replaces the route when markdown input updates", async () => {
    const { app, router } = await mountApp();
    await waitForPaginate();

    const replaceSpy = vi.spyOn(router, "replace");
    const textarea = container.querySelector("textarea");
    textarea.value = "Share me";
    textarea.dispatchEvent(new Event("input"));
    await nextTick();

    expect(replaceSpy).toHaveBeenCalledWith({ path: "/Share%20me" });
    app.unmount();
  });

  it("syncs textarea when the route changes", async () => {
    const { app, router } = await mountApp();
    await waitForPaginate();

    await router.push("/%E6%96%87%E5%AD%97");
    await nextTick();

    const textarea = container.querySelector("textarea");
    expect(textarea.value).toBe("文字");

    app.unmount();
  });

  it("returns early when measurement refs are missing", async () => {
    const { app, vm } = await mountApp();
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

    const { app, vm } = await mountApp();
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

    const { app, vm } = await mountApp();
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

    const { app, vm } = await mountApp();
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

    const { app, vm } = await mountApp();
    await waitForPaginate();

    await vm.exportAllPng();

    expect(createObjectURL).not.toHaveBeenCalled();
    app.unmount();
  });

  it("exits export early when the capture node is missing", async () => {
    html2canvas.mockResolvedValue(createCanvas(new Blob(["data"], { type: "image/png" })));
    const { app, vm } = await mountApp();
    await waitForPaginate();

    vm.$.exposed.setPageCaptureNode(null);
    await vm.exportAllPng();

    expect(html2canvas).not.toHaveBeenCalled();
    app.unmount();
  });

  it("resets to full HTML when no pages are available", async () => {
    paginateHtml.mockReturnValue([]);
    const { app, vm } = await mountApp();
    await waitForPaginate();

    vm.pagesHtml = [];
    await vm.exportAllPng();

    const preview = container.querySelector(".md-body");
    expect(preview.innerHTML).toContain("Rendered");

    app.unmount();
  });
});
