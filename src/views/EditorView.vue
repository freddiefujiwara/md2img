<script setup>
import { ref, computed, nextTick, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { marked } from "marked";
import html2canvas from "html2canvas";

import { paginateHtml } from "../lib/pagination";
import { imagePresets, resolvePreset, textColorPresets } from "../lib/presets";
import { buildPageStyle } from "../lib/style";
import { createDebounce } from "../lib/timing";
import { sampleMarkdown } from "../lib/sampleMarkdown";
import { uiText } from "../lib/uiText";
import { decodeMarkdownFromPath, encodeMarkdownToPath } from "../lib/url";

const route = useRoute();
const router = useRouter();

// --- State ---
const presetKey = ref("x");
const backgroundColor = ref("#ffffff");
const textColor = ref(textColorPresets[0].value);
const fontSize = ref(22);
const lineHeight = ref(1.55);
const padding = ref(52);
const markdownInput = ref(sampleMarkdown);
const pagesHtml = ref([]); // HTML for each page.
const exporting = ref(false);
const isReady = ref(false);

// --- DOM Refs ---
const measureWrapRef = ref(null);
const measureContentRef = ref(null);
const pageCaptureRef = ref(null);

// --- Computed ---
const fullHtml = computed(() => marked.parse(markdownInput.value));

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

// --- Methods ---

/**
 * Calculates how the HTML should be split into pages based on the container height.
 */
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

/**
 * Syncs the markdown input from the URL route parameters.
 */
const syncFromRoute = (encodedValue) => {
  const decoded = decodeMarkdownFromPath(encodedValue);
  if (decoded && decoded !== markdownInput.value) {
    markdownInput.value = decoded;
    // schedulePaginate will be triggered by the watch on markdownInput
  }
};

/**
 * Captures all pages as PNG images and either shares them or triggers downloads.
 */
async function exportAllPng() {
  if (exporting.value) return;
  exporting.value = true;
  try {
    if ("fonts" in document) await document.fonts.ready;

    const preset = activePreset.value.preset;
    const scale = 2;
    const captureNode = pageCaptureRef.value;
    if (!captureNode) return;

    const files = [];

    // Capture each page by swapping content in the capture node
    for (let i = 0; i < pagesHtml.value.length; i++) {
      await nextTick();
      captureNode.querySelector(".md-body").innerHTML = pagesHtml.value[i];

      const canvas = await html2canvas(captureNode, {
        backgroundColor: null,
        scale,
        useCORS: true,
      });

      const filename = `md_${activePreset.value.key}_${preset.width}x${preset.height}_p${String(i + 1).padStart(2, "0")}.png`;
      const blob = await new Promise((resolve) => {
        canvas.toBlob((result) => resolve(result), "image/png");
      });

      if (blob) {
        files.push({ blob, filename });
      }
    }

    if (files.length === 0) return;

    // Handle mobile sharing if available
    const isMobile =
      typeof navigator !== "undefined" &&
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || "");
    if (isMobile && navigator.canShare && navigator.share) {
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
          // Fall back to download if share failed or was cancelled
        }
      }
    }

    // Standard download fallback
    const downloadBlob = (blob, filename) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    };

    files.forEach(({ blob, filename }) => downloadBlob(blob, filename));
  } finally {
    exporting.value = false;
    await nextTick();
    if (pageCaptureRef.value) {
      pageCaptureRef.value.querySelector(".md-body").innerHTML =
        pagesHtml.value[0] || fullHtml.value;
    }
  }
}

// --- Watchers ---

// Watch for changes in markdown or styles to trigger pagination.
watch(
  [markdownInput, presetKey, backgroundColor, textColor, fontSize, lineHeight, padding],
  () => {
    if (isReady.value) {
      schedulePaginate();
    }
  }
);

const debouncedReplace = createDebounce((path) => {
  router.replace({ path });
}, 500);

// Sync route when markdown input changes
watch(markdownInput, (value) => {
  if (!isReady.value) return;
  const targetPath = encodeMarkdownToPath(value);
  if (route.path !== targetPath) {
    debouncedReplace(targetPath);
  }
});

// Sync input when route changes (e.g., browser back/forward)
watch(
  () => route.params.encoded,
  (encodedValue) => {
    syncFromRoute(encodedValue);
  }
);

// --- Lifecycle ---
onMounted(() => {
  syncFromRoute(route.params.encoded);
  paginate();
  isReady.value = true;
});

// --- Expose for testing ---
defineExpose(
  import.meta.env.MODE === "test"
    ? {
        paginate,
        exportAllPng,
        setPageCaptureNode: (node) => {
          pageCaptureRef.value = node;
        },
        measureWrapRef,
        measureContentRef,
        pageCaptureRef,
        pagesHtml,
        fullHtml,
      }
    : {}
);
</script>

<template>
  <div class="min-h-dvh bg-slate-50 text-slate-900">
    <header class="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200">
      <div class="max-w-6xl mx-auto px-3 py-2 flex flex-wrap gap-2 items-center">
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="(preset, key) in imagePresets"
            :key="key"
            class="px-3 py-2 rounded-lg text-sm border transition-colors"
            :class="presetKey === key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50'"
            @click="presetKey = key"
          >
            {{ preset.label }}
          </button>
        </div>

        <div class="flex items-center gap-2 ml-auto flex-wrap">
          <label class="text-xs text-slate-600">{{ uiText.backgroundLabel }}</label>
          <input
            type="color"
            v-model="backgroundColor"
            class="h-9 w-10 rounded border border-slate-200 cursor-pointer"
          />

          <label class="text-xs text-slate-600 ml-2">{{ uiText.textColorLabel }}</label>
          <div class="flex gap-1">
            <button
              v-for="option in textColorPresets"
              :key="option.value"
              class="h-9 px-2 rounded-lg text-xs border flex items-center gap-2 transition-colors"
              :class="textColor === option.value ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white hover:bg-slate-50'"
              @click="textColor = option.value"
            >
              <span class="inline-block h-4 w-4 rounded-full border border-slate-200" :style="{ background: option.value }"></span>
              {{ option.label }}
            </button>
          </div>

          <label class="text-xs text-slate-600 ml-2">{{ uiText.textSizeLabel }}</label>
          <input type="range" min="16" max="30" step="1" v-model.number="fontSize" class="cursor-pointer" />
          <span class="text-xs w-8 text-right font-mono">{{ fontSize }}px</span>

          <label class="text-xs text-slate-600 ml-2">{{ uiText.lineHeightLabel }}</label>
          <input type="range" min="1.2" max="1.9" step="0.05" v-model.number="lineHeight" class="cursor-pointer" />
          <span class="text-xs w-10 text-right font-mono">{{ lineHeight.toFixed(2) }}</span>

          <button
            class="ml-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold shadow-sm hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            :disabled="exporting"
            @click="exportAllPng"
          >
            {{ exporting ? uiText.savingLabel : `${uiText.savePngLabel} (${pagesHtml.length})` }}
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto p-3 grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
      <!-- Editor -->
      <section class="bg-white rounded-2xl border border-slate-200 overflow-hidden min-w-0 shadow-sm">
        <div class="px-4 py-2 border-b border-slate-200 bg-slate-50/50 text-sm font-semibold flex items-center justify-between">
          <span>{{ uiText.markdownLabel }}</span>
          <button
            class="text-xs px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
            @click="markdownInput = ''"
          >
            {{ uiText.clearMarkdownLabel }}
          </button>
        </div>
        <textarea
          v-model="markdownInput"
          class="w-full h-[45dvh] lg:h-[75dvh] p-4 font-mono text-sm outline-none resize-none bg-transparent"
        />
      </section>

      <!-- Preview -->
      <section class="bg-white rounded-2xl border border-slate-200 overflow-hidden min-w-0 shadow-sm">
        <div class="px-4 py-2 border-b border-slate-200 bg-slate-50/50 text-sm font-semibold">
          {{ uiText.previewLabel }} / {{ uiText.pageCountLabel(pagesHtml.length) }}
        </div>

        <div class="p-3 overflow-auto h-[45dvh] lg:h-[75dvh]">
          <div class="flex justify-center min-h-full items-start">
            <div
              ref="pageCaptureRef"
              class="shadow-2xl rounded-sm overflow-hidden"
              :style="pageStyle"
            >
              <div class="md-body" v-html="pagesHtml[0] || fullHtml"></div>
            </div>
          </div>

          <p class="mt-4 text-xs text-slate-500 text-center">
            {{ uiText.splitHint }}
          </p>
        </div>
      </section>
    </main>

    <!-- Hidden area for measuring height. -->
    <div class="fixed -left-[99999px] top-0 opacity-0 pointer-events-none" aria-hidden="true">
      <div ref="measureWrapRef" class="overflow-hidden" :style="pageStyle">
        <div ref="measureContentRef"></div>
      </div>
    </div>

    <!-- Mobile save button at the bottom. -->
    <div class="lg:hidden fixed bottom-4 left-4 right-4 z-20">
      <button
        class="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold shadow-xl hover:bg-emerald-700 disabled:opacity-60 transition-all"
        :disabled="exporting"
        @click="exportAllPng"
      >
        {{ exporting ? uiText.savingLabel : `${uiText.savePngLabel} (${pagesHtml.length})` }}
      </button>
    </div>
    <div class="h-24 lg:hidden"></div>
  </div>
</template>
