<script setup>
const props = defineProps({
  targetRef: {
    type: Object,
    default: null,
  },
});

import { onBeforeUnmount, onMounted, ref } from "vue";

const focusTextarea = (textarea) => {
  textarea.focus({ preventScroll: true });
};

const updateTextarea = (textarea, newValue, selectionStart, selectionEnd) => {
  textarea.value = newValue;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  focusTextarea(textarea);
  textarea.setSelectionRange(selectionStart, selectionEnd);
};

const getTextarea = () => {
  const target = props.targetRef;
  if (!target) return null;
  if (target?.tagName === "TEXTAREA") return target;
  if (target?.value?.tagName === "TEXTAREA") return target.value;
  return null;
};

const applyLinePrefix = (type) => {
  const textarea = getTextarea();
  if (!textarea) return;

  const value = textarea.value;
  const start = textarea.selectionStart ?? 0;
  const end = textarea.selectionEnd ?? 0;
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const rawLineEnd = value.indexOf("\n", start);
  const lineEnd = rawLineEnd === -1 ? value.length : rawLineEnd;
  const line = value.slice(lineStart, lineEnd);

  let newLine = line;
  if (type === "heading") {
    const match = line.match(/^(#+)\s*/);
    if (match) {
      const hashes = "#".repeat(match[1].length + 1);
      newLine = `${hashes} ${line.slice(match[0].length)}`;
    } else {
      newLine = `# ${line}`;
    }
  }

  if (type === "list") {
    newLine = /^- /.test(line) ? line.replace(/^- /, "") : `- ${line}`;
  }

  if (type === "quote") {
    newLine = /^> /.test(line) ? line.replace(/^> /, "") : `> ${line}`;
  }

  if (type === "rule") {
    newLine = line.trim() === "---" ? line.replace(/---/, "") : "---";
  }

  const newValue = value.slice(0, lineStart) + newLine + value.slice(lineEnd);
  const delta = newLine.length - line.length;
  updateTextarea(textarea, newValue, start + delta, end + delta);
};

const insertSnippet = (snippet, cursorOffset) => {
  const textarea = getTextarea();
  if (!textarea) return;

  const value = textarea.value;
  const start = textarea.selectionStart ?? 0;
  const end = textarea.selectionEnd ?? 0;
  const newValue = value.slice(0, start) + snippet + value.slice(end);
  const cursor = start + cursorOffset;
  updateTextarea(textarea, newValue, cursor, cursor);
};

const handleLineAction = (type) => {
  applyLinePrefix(type);
};

const handleSnippetAction = (snippet, cursorOffset) => {
  insertSnippet(snippet, cursorOffset);
};

const toolbarOffset = ref(0);

const updateToolbarOffset = () => {
  if (typeof window === "undefined") return;
  const viewport = window.visualViewport;
  if (!viewport) {
    toolbarOffset.value = 0;
    return;
  }
  const offsetFromBottom = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
  toolbarOffset.value = offsetFromBottom;
};

onMounted(() => {
  updateToolbarOffset();
  if (typeof window === "undefined") return;
  window.addEventListener("resize", updateToolbarOffset);
  window.addEventListener("scroll", updateToolbarOffset);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", updateToolbarOffset);
    window.visualViewport.addEventListener("scroll", updateToolbarOffset);
  }
});

onBeforeUnmount(() => {
  if (typeof window === "undefined") return;
  window.removeEventListener("resize", updateToolbarOffset);
  window.removeEventListener("scroll", updateToolbarOffset);
  if (window.visualViewport) {
    window.visualViewport.removeEventListener("resize", updateToolbarOffset);
    window.visualViewport.removeEventListener("scroll", updateToolbarOffset);
  }
});

defineExpose(
  import.meta.env.MODE === "test"
    ? {
        toolbarOffset,
      }
    : {}
);
</script>

<template>
  <div
    class="lg:hidden fixed inset-x-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur"
    :style="{
      bottom: `calc(${toolbarOffset}px + env(safe-area-inset-bottom, 0px))`,
      paddingBottom: '0.5rem',
    }"
  >
    <div class="px-3 pt-2 overflow-x-auto">
      <div class="flex gap-2 min-w-max" role="toolbar" aria-label="Markdown toolbar">
        <button
          type="button"
          class="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold shadow-sm"
          data-action="heading"
          @mousedown.prevent
          @touchstart.prevent.stop="handleLineAction('heading')"
          @click="handleLineAction('heading')"
        >
          #
        </button>
        <button
          type="button"
          class="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold shadow-sm"
          data-action="list"
          @mousedown.prevent
          @touchstart.prevent.stop="handleLineAction('list')"
          @click="handleLineAction('list')"
        >
          -
        </button>
        <button
          type="button"
          class="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold shadow-sm"
          data-action="quote"
          @mousedown.prevent
          @touchstart.prevent.stop="handleLineAction('quote')"
          @click="handleLineAction('quote')"
        >
          &gt;
        </button>
        <button
          type="button"
          class="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold shadow-sm"
          data-action="bold"
          @mousedown.prevent
          @touchstart.prevent.stop="handleSnippetAction('****', 2)"
          @click="handleSnippetAction('****', 2)"
        >
          ****
        </button>
        <button
          type="button"
          class="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold shadow-sm"
          data-action="strike"
          @mousedown.prevent
          @touchstart.prevent.stop="handleSnippetAction('~~~~', 2)"
          @click="handleSnippetAction('~~~~', 2)"
        >
          ~~~~
        </button>
        <button
          type="button"
          class="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold shadow-sm"
          data-action="rule"
          @mousedown.prevent
          @touchstart.prevent.stop="handleLineAction('rule')"
          @click="handleLineAction('rule')"
        >
          ---
        </button>
      </div>
    </div>
  </div>
</template>
