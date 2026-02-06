import { createApp, nextTick, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MarkdownToolbar from "./MarkdownToolbar.vue";

const mountToolbar = async (initialValue = "Hello") => {
  const Wrapper = {
    components: { MarkdownToolbar },
    setup() {
      const value = ref(initialValue);
      const textarea = ref(null);
      const toolbarRef = ref(null);
      return { value, textarea, toolbarRef };
    },
    template: `
      <div>
        <textarea ref="textarea" v-model="value"></textarea>
        <MarkdownToolbar ref="toolbarRef" :target-ref="textarea" />
      </div>
    `,
  };

  const app = createApp(Wrapper);
  const container = document.createElement("div");
  document.body.appendChild(container);
  const vm = app.mount(container);
  await nextTick();

  const textarea = container.querySelector("textarea");
  return { app, container, textarea, vm };
};

describe("MarkdownToolbar", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("adds and increments heading prefixes at the line start", async () => {
    const { app, container, textarea } = await mountToolbar("Title");
    textarea.setSelectionRange(5, 5);

    container.querySelector('[data-action="heading"]').click();
    expect(textarea.value).toBe("# Title");

    textarea.setSelectionRange(7, 7);
    container.querySelector('[data-action="heading"]').click();
    expect(textarea.value).toBe("## Title");

    app.unmount();
  });

  it("toggles list and quote prefixes", async () => {
    const { app, container, textarea } = await mountToolbar("- Item");
    textarea.setSelectionRange(6, 6);

    container.querySelector('[data-action="list"]').click();
    expect(textarea.value).toBe("Item");

    container.querySelector('[data-action="quote"]').click();
    expect(textarea.value).toBe("> Item");

    container.querySelector('[data-action="quote"]').click();
    expect(textarea.value).toBe("Item");

    app.unmount();
  });

  it("inserts snippets and places the cursor between markers", async () => {
    const { app, container, textarea } = await mountToolbar("Hello");
    textarea.setSelectionRange(5, 5);

    container.querySelector('[data-action="bold"]').click();
    expect(textarea.value).toBe("Hello**");
    expect(textarea.selectionStart).toBe(6);

    container.querySelector('[data-action="code"]').click();
    expect(textarea.value).toBe("Hello*``*");
    expect(textarea.selectionStart).toBe(7);

    container.querySelector('[data-action="table"]').click();
    expect(textarea.value).toBe("Hello*`|`*");
    expect(textarea.selectionStart).toBe(8);

    container.querySelector('[data-action="table-divider"]').click();
    expect(textarea.value).toBe("Hello*`||-`*");
    expect(textarea.selectionStart).toBe(10);

    container.querySelector('[data-action="strike"]').click();
    expect(textarea.value).toBe("Hello*`||-~~~~`*");
    expect(textarea.selectionStart).toBe(12);

    app.unmount();
  });

  it("toggles the horizontal rule line", async () => {
    const { app, container, textarea } = await mountToolbar("Line");
    textarea.setSelectionRange(2, 2);

    container.querySelector('[data-action="rule"]').click();
    expect(textarea.value).toBe("---");

    container.querySelector('[data-action="rule"]').click();
    expect(textarea.value).toBe("");

    app.unmount();
  });

  it("updates toolbarOffset when visualViewport events occur", async () => {
    // Mock visualViewport
    const visualViewport = {
      height: 500,
      offsetTop: 0,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal("innerHeight", 800);
    vi.stubGlobal("visualViewport", visualViewport);

    const { app, vm } = await mountToolbar();
    await nextTick();

    // visualViewport.height is 500, window.innerHeight is 800.
    // offsetFromBottom = 800 - 500 - 0 = 300.
    expect(vm.toolbarRef.toolbarOffset).toBe(300);

    // Simulate change
    visualViewport.height = 400;
    window.dispatchEvent(new Event("resize"));
    await nextTick();

    // offsetFromBottom = 800 - 400 - 0 = 400.
    expect(vm.toolbarRef.toolbarOffset).toBe(400);

    app.unmount();
    vi.unstubAllGlobals();
  });

  it("handles null target-ref gracefully", async () => {
    const Wrapper = {
      components: { MarkdownToolbar },
      template: `<MarkdownToolbar :target-ref="null" />`,
    };
    const app = createApp(Wrapper);
    const container = document.createElement("div");
    app.mount(container);
    await nextTick();

    // Should not throw when clicked
    const headingButton = container.querySelector('[data-action="heading"]');
    headingButton.click();

    app.unmount();
  });

  it("handles non-textarea targets", async () => {
    // Test case where target is defined but not a textarea
    const Wrapper = {
      components: { MarkdownToolbar },
      template: `<MarkdownToolbar :target-ref="{ tagName: 'DIV' }" />`,
    };
    const app = createApp(Wrapper);
    const container = document.createElement("div");
    app.mount(container);
    await nextTick();
    const headingButton = container.querySelector('[data-action="heading"]');
    headingButton.click();
    app.unmount();
  });

  it("handles ref-like targets that are not textareas", async () => {
    // Test case where target.value is defined but not a textarea
    const Wrapper = {
      components: { MarkdownToolbar },
      template: `<MarkdownToolbar :target-ref="{ value: { tagName: 'DIV' } }" />`,
    };
    const app = createApp(Wrapper);
    const container = document.createElement("div");
    app.mount(container);
    await nextTick();
    const headingButton = container.querySelector('[data-action="heading"]');
    headingButton.click();
    app.unmount();
  });
});
