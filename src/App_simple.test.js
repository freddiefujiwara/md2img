import { describe, it, expect } from "vitest";
import { createApp, nextTick } from "vue";
import App from "./App.vue";
import { createRouter, createMemoryHistory } from "vue-router";

describe("App.vue", () => {
  it("renders RouterView", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: "/", component: { template: "<div>Home</div>" } }],
    });
    router.push("/");
    await router.isReady();

    const container = document.createElement("div");
    const app = createApp(App);
    app.use(router);
    app.mount(container);

    await nextTick();
    expect(container.innerHTML).toContain("Home");
    app.unmount();
  });
});
