<script setup>
import { ref, computed, nextTick, onMounted } from "vue";
import { marked } from "marked";
import html2canvas from "html2canvas";

import { paginateHtml } from "./lib/pagination";
import { imagePresets, resolvePreset, textColorPresets } from "./lib/presets";
import { buildPageStyle } from "./lib/style";
import { createDebounce } from "./lib/timing";
import { sampleMarkdown } from "./lib/sampleMarkdown";
import { uiText } from "./lib/uiText";

const presetKey = ref("x");

const backgroundColor = ref("#ffffff");
const textColor = ref(textColorPresets[0].value);
const fontSize = ref(22);
const lineHeight = ref(1.55);
const padding = ref(52);

const markdownInput = ref(sampleMarkdown);

const fullHtml = computed(() => marked.parse(markdownInput.value));
const pagesHtml = ref([]); // HTML for each page.

const exporting = ref(false);

// Hidden DOM for measuring height.
const measureWrapRef = ref(null);
const measureContentRef = ref(null);

// Visible DOM for capture.
const pageCaptureRef = ref(null);

const activePreset = computed(() => resolvePreset(imagePresets, presetKey.value, "x"));
const pageStyle = computed(() =>
  buildPageStyle({
    preset: activePreset.value.preset,
    backgroundColor: backgroundColor.value,
    textColor: textColor.value,
    fontSize: fontSize.value,
    lineHeight: lineHeight.value,
    padding: padding.value,
  })
);

async function paginate() {
  await nextTick();
  const wrap = measureWrapRef.value;
  const content = measureContentRef.value;
  if (!wrap || !content) return;

  const maxHeight = activePreset.value.preset.height;

  const measure = (candidate) => {
    content.innerHTML = `<div class="md-body">${candidate}</div>`;
    return content.scrollHeight;
  };

  pagesHtml.value = paginateHtml({
    html: fullHtml.value,
    maxHeight,
    measure,
    doc: document,
  });
}

const schedulePaginate = createDebounce(() => paginate(), 120);

async function exportAllPng() {
  exporting.value = true;
  try {
    // Wait for web fonts.
    if ("fonts" in document) await document.fonts.ready;

    const preset = activePreset.value.preset;
    const scale = 2;

    const downloadBlob = (blob, filename) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    };

    const files = [];

    // Capture each page.
    for (let i = 0; i < pagesHtml.value.length; i++) {
      await nextTick();

      const node = pageCaptureRef.value;
      if (!node) return;

      // Swap page HTML.
      node.querySelector(".md-body").innerHTML = pagesHtml.value[i];

      const canvas = await html2canvas(node, {
        backgroundColor: null,
        scale,
        useCORS: true,
      });

      const filename = `md_${activePreset.value.key}_${preset.width}x${preset.height}_p${String(i + 1).padStart(2, "0")}.png`;
      const blob = await new Promise((resolve) => {
        canvas.toBlob((result) => resolve(result), "image/png");
      });

      if (!blob) continue;

      files.push({ blob, filename });
    }

    if (files.length === 1) {
      downloadBlob(files[0].blob, files[0].filename);
      return;
    }

    const canShare =
      typeof navigator !== "undefined" &&
      typeof navigator.canShare === "function" &&
      typeof navigator.share === "function";

    if (canShare) {
      const shareFiles = files.map(
        ({ blob, filename }) => new File([blob], filename, { type: "image/png" })
      );
      if (navigator.canShare({ files: shareFiles })) {
        try {
          await navigator.share({
            files: shareFiles,
            title: "Markdown to Image",
          });
          return;
        } catch (error) {
          // Fall back to sequential downloads if sharing is dismissed or fails.
        }
      }
    }

    for (const { blob, filename } of files) {
      downloadBlob(blob, filename);
    }
  } finally {
    exporting.value = false;
    // Reset to the first page.
    await nextTick();
    const node = pageCaptureRef.value;
    if (node) node.querySelector(".md-body").innerHTML = pagesHtml.value[0] || fullHtml.value;
  }
}

onMounted(() => {
  paginate();
});
</script>

<template>
  <div class="min-h-dvh bg-slate-50">
    <header class="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
      <div class="max-w-6xl mx-auto px-3 py-2 flex flex-wrap gap-2 items-center">
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="(preset, key) in imagePresets"
            :key="key"
            class="px-3 py-2 rounded-lg text-sm border"
            :class="presetKey === key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white'"
            @click="presetKey = key; schedulePaginate()"
          >
            {{ preset.label }}
          </button>
        </div>

        <div class="flex items-center gap-2 ml-auto flex-wrap">
          <label class="text-xs text-slate-600">{{ uiText.backgroundLabel }}</label>
          <input
            type="color"
            v-model="backgroundColor"
            class="h-9 w-10 rounded border"
            @input="schedulePaginate"
          />

          <label class="text-xs text-slate-600 ml-2">{{ uiText.textColorLabel }}</label>
          <div class="flex gap-1">
            <button
              v-for="option in textColorPresets"
              :key="option.value"
              class="h-9 px-2 rounded-lg text-xs border flex items-center gap-2"
              :class="textColor === option.value ? 'border-slate-900' : 'border-slate-200'"
              @click="textColor = option.value; schedulePaginate()"
            >
              <span class="inline-block h-4 w-4 rounded-full border" :style="{ background: option.value }"></span>
              {{ option.label }}
            </button>
          </div>

          <label class="text-xs text-slate-600 ml-2">{{ uiText.textSizeLabel }}</label>
          <input type="range" min="16" max="30" step="1" v-model.number="fontSize" @input="schedulePaginate" />
          <span class="text-xs w-10 text-right">{{ fontSize }}px</span>

          <label class="text-xs text-slate-600 ml-2">{{ uiText.lineHeightLabel }}</label>
          <input type="range" min="1.2" max="1.9" step="0.05" v-model.number="lineHeight" @input="schedulePaginate" />
          <span class="text-xs w-10 text-right">{{ lineHeight.toFixed(2) }}</span>

          <button
            class="ml-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold disabled:opacity-60"
            :disabled="exporting"
            @click="exportAllPng"
          >
            {{ exporting ? uiText.savingLabel : `${uiText.savePngLabel} (${pagesHtml.length})` }}
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto p-3 grid grid-cols-1 lg:grid-cols-2 gap-3 min-w-0">
      <!-- Editor -->
      <section class="bg-white rounded-2xl border overflow-hidden min-w-0">
        <div class="px-4 py-2 border-b text-sm font-semibold flex items-center justify-between">
          <span>{{ uiText.markdownLabel }}</span>
          <div class="flex items-center gap-2">
            <button
              class="text-xs px-2 py-1 rounded border"
              @click="markdownInput = ''; schedulePaginate()"
            >
              {{ uiText.clearMarkdownLabel }}
            </button>
            <button class="text-xs px-2 py-1 rounded border" @click="paginate">
              {{ uiText.repaginateLabel }}
            </button>
          </div>
        </div>
        <textarea
          v-model="markdownInput"
          class="w-full h-[45dvh] lg:h-[75dvh] p-4 font-mono text-sm outline-none resize-none"
          @input="schedulePaginate"
        />
      </section>

      <!-- Preview -->
      <section class="bg-white rounded-2xl border overflow-hidden min-w-0">
        <div class="px-4 py-2 border-b text-sm font-semibold">
          {{ uiText.previewLabel }} / {{ uiText.pageCountLabel(pagesHtml.length) }}
        </div>

        <div class="p-3 overflow-auto">
          <div class="flex justify-center">
            <!-- Show full size, scroll to view. -->
            <div
              ref="pageCaptureRef"
              class="shadow-xl rounded-xl overflow-hidden"
              :style="pageStyle"
            >
              <div class="md-body" v-html="pagesHtml[0] || fullHtml"></div>
            </div>
          </div>

          <p class="mt-3 text-xs text-slate-500">
            {{ uiText.splitHint }}
          </p>
        </div>
      </section>
    </main>

    <!-- Hidden area for measuring height. -->
    <div class="fixed -left-[99999px] top-0 opacity-0 pointer-events-none">
      <div ref="measureWrapRef" class="overflow-hidden" :style="pageStyle">
        <div ref="measureContentRef"></div>
      </div>
    </div>

    <!-- Mobile save button at the bottom. -->
    <div class="lg:hidden fixed bottom-3 left-3 right-3">
      <button
        class="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold shadow-lg disabled:opacity-60"
        :disabled="exporting"
        @click="exportAllPng"
      >
        {{ exporting ? uiText.savingLabel : `${uiText.savePngLabel} (${pagesHtml.length})` }}
      </button>
    </div>
    <div class="h-20 lg:hidden"></div>
  </div>
</template>
