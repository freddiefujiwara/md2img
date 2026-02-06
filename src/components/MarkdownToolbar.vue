<script setup>
const props = defineProps({
  targetRef: {
    type: Object,
    default: null,
  },
});

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
</script>

<template>
  <div
    class="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur"
    style="padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 0.5rem);"
  >
    <div class="px-3 pt-2 overflow-x-auto">
      <div class="flex gap-2 min-w-max" role="toolbar" aria-label="Markdown toolbar">
        <button
          type="button"
          class="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold shadow-sm"
          data-action="heading"
          @mousedown.prevent
          @touchstart.prevent
          @click="applyLinePrefix('heading')"
        >
          #
        </button>
        <button
          type="button"
          class="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold shadow-sm"
          data-action="list"
          @mousedown.prevent
          @touchstart.prevent
          @click="applyLinePrefix('list')"
        >
          -
        </button>
        <button
          type="button"
          class="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold shadow-sm"
          data-action="quote"
          @mousedown.prevent
          @touchstart.prevent
          @click="applyLinePrefix('quote')"
        >
          &gt;
        </button>
        <button
          type="button"
          class="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold shadow-sm"
          data-action="link"
          @mousedown.prevent
          @touchstart.prevent
          @click="insertSnippet('[]()', 1)"
        >
          []()
        </button>
        <button
          type="button"
          class="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold shadow-sm"
          data-action="bold"
          @mousedown.prevent
          @touchstart.prevent
          @click="insertSnippet('****', 2)"
        >
          ****
        </button>
      </div>
    </div>
  </div>
</template>
