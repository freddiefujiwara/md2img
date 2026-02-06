import { createApp, nextTick, ref } from "vue";
import { beforeEach, describe, expect, it } from "vitest";
import MarkdownToolbar from "./MarkdownToolbar.vue";

const mountToolbar = async (initialValue = "Hello") => {
  const Wrapper = {
    components: { MarkdownToolbar },
    setup() {
      const value = ref(initialValue);
      const textarea = ref(null);
      return { value, textarea };
    },
    template: `
      <div>
        <textarea ref="textarea" v-model="value"></textarea>
        <MarkdownToolbar :target-ref="textarea" />
      </div>
    `,
  };

  const app = createApp(Wrapper);
  const container = document.createElement("div");
  document.body.appendChild(container);
  app.mount(container);
  await nextTick();

  const textarea = container.querySelector("textarea");
  return { app, container, textarea };
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
    expect(textarea.value).toBe("Hello****");
    expect(textarea.selectionStart).toBe(7);

    container.querySelector('[data-action="strike"]').click();
    expect(textarea.value).toBe("Hello**~~~~**");
    expect(textarea.selectionStart).toBe(9);

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
});
