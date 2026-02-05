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
    const { app, container } = await mountEditor("/%E3%83%86%E3%82%B9%E3%83%88");
    await nextTick();

    const textarea = container.querySelector("textarea");
    expect(textarea.value).toBe("テスト");

    app.unmount();
  });

  it("replaces the route when input changes", async () => {
    const { app, container, router } = await mountEditor();
    await nextTick();

    const replaceSpy = vi.spyOn(router, "replace");
    const textarea = container.querySelector("textarea");
    textarea.value = "Share me";
    textarea.dispatchEvent(new Event("input"));
    await nextTick();

    expect(replaceSpy).toHaveBeenCalledWith({ path: "/Share%20me" });

    app.unmount();
  });
});
