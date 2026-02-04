<script setup>

import { ref, computed, nextTick, onMounted } from "vue";

import { marked } from "marked";

import html2canvas from "html2canvas";



const presets = {

x: { label: "X (1200×675)", w: 1200, h: 675 },

   ig_post: { label: "Instagram 投稿 (1080×1080)", w: 1080, h: 1080 },

   ig_story: { label: "Instagram ストーリーズ (1080×1920)", w: 1080, h: 1920 },

   fb: { label: "Facebook (1200×630)", w: 1200, h: 630 },

};



const presetKey = ref("x");



// SNS向け：文字小さめデフォルト

const bg = ref("#ffffff");

const fontSize = ref(22);

const lineHeight = ref(1.55);

const padding = ref(52);



// 1枚目の要約が効くので、サンプルもそれっぽく

const md = ref(`# タイトル（要約）

    ここに要点を短く書きます。続きは画像本文。



    ---



## 本文

    Xの255文字制限を超える長文を、Markdownから画像にして投稿します。



    - 自動で複数枚に分割

    - 画像は高解像度で保存（scale:2）

    - スマホでも操作しやすい



段落を増やすとページが増えます。`.repeat(6));



const fullHtml = computed(() => marked.parse(md.value));

const pagesHtml = ref([]); // 分割後の各ページHTML（md-body内に差し込む）



const exporting = ref(false);



// 計測＆分割用の隠しDOM

const measureWrapRef = ref(null);

const measureContentRef = ref(null);



// 書き出し/表示用のDOM（ここをhtml2canvasで撮る）

const pageCaptureRef = ref(null);



function getPreset() {

  return presets[presetKey.value];

}



function pageStyle() {

  const p = getPreset();

  return {

width: `${p.w}px`,

         height: `${p.h}px`,

         background: bg.value,

         fontSize: `${fontSize.value}px`,

         lineHeight: String(lineHeight.value),

         padding: `${padding.value}px`,

         fontFamily:

           "system-ui, -apple-system, 'Hiragino Sans', 'Noto Sans JP', 'Yu Gothic', 'Meiryo', sans-serif",

  };

}



// markedの出力HTMLを「直下ブロック」単位で分解して積む（安定）

function splitIntoBlocks(html) {

  const tmp = document.createElement("div");

  tmp.innerHTML = html;

  const blocks = [];

  for (const node of tmp.childNodes) {

    if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) continue;

    const wrap = document.createElement("div");

    wrap.appendChild(node.cloneNode(true));

    blocks.push(wrap.innerHTML);

  }

  return blocks;

}



async function paginate() {

  await nextTick();

  const wrap = measureWrapRef.value;

  const content = measureContentRef.value;

  if (!wrap || !content) return;



  const blocks = splitIntoBlocks(fullHtml.value);

  const p = getPreset();

  const maxHeight = p.h;



  const pages = [];

  let current = "";



  content.innerHTML = "";

  for (let i = 0; i < blocks.length; i++) {

    const candidate = current + blocks[i];

    content.innerHTML = `<div class="md-body">${candidate}</div>`;



    // 溢れたら前のcurrentを確定

    if (content.scrollHeight > maxHeight) {

      if (!current) {

        // 1ブロックだけで溢れる場合：そのまま1ページ扱い（はみ出す可能性あり）

        // ※必要なら後で「そのブロック内をさらに分割」も可能

        pages.push(blocks[i]);

        current = "";

        content.innerHTML = "";

      } else {

        pages.push(current);

        current = blocks[i];

        content.innerHTML = `<div class="md-body">${current}</div>`;

      }

    } else {

      current = candidate;

    }

  }



  if (current) pages.push(current);

  pagesHtml.value = pages.length ? pages : [fullHtml.value];

}



function schedulePaginate() {

  clearTimeout(schedulePaginate._t);

  schedulePaginate._t = setTimeout(() => paginate(), 120);

}



async function exportAllPng() {

  exporting.value = true;

  try {

    // Webフォント利用時に重要

    if ("fonts" in document) await document.fonts.ready;



    const p = getPreset();

    const scale = 2;



    // 1ページずつ差し替えてキャプチャ（確実）

    for (let i = 0; i < pagesHtml.value.length; i++) {

      await nextTick();



      const node = pageCaptureRef.value;

      if (!node) return;



      // いま表示するページに差し替え

      node.querySelector(".md-body").innerHTML = pagesHtml.value[i];



      const canvas = await html2canvas(node, {

backgroundColor: null,

scale,

useCORS: true,

});



const url = canvas.toDataURL("image/png");

const a = document.createElement("a");

a.href = url;

a.download = `md_${presetKey.value}_${p.w}x${p.h}_p${String(i + 1).padStart(2, "0")}.png`;

a.click();

}

} finally {

  exporting.value = false;

  // 書き出し後、表示を1ページ目に戻す

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

v-for="(p, key) in presets"

:key="key"

class="px-3 py-2 rounded-lg text-sm border"

:class="presetKey === key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white'"

@click="presetKey = key; schedulePaginate()"

>

{{ p.label }}

</button>

</div>



<div class="flex items-center gap-2 ml-auto flex-wrap">

<label class="text-xs text-slate-600">背景</label>

<input type="color" v-model="bg" class="h-9 w-10 rounded border" @input="schedulePaginate" />



<label class="text-xs text-slate-600 ml-2">文字</label>

<input type="range" min="16" max="30" step="1" v-model.number="fontSize" @input="schedulePaginate" />

<span class="text-xs w-10 text-right">{{ fontSize }}px</span>



<label class="text-xs text-slate-600 ml-2">行間</label>

<input type="range" min="1.2" max="1.9" step="0.05" v-model.number="lineHeight" @input="schedulePaginate" />

<span class="text-xs w-10 text-right">{{ lineHeight.toFixed(2) }}</span>



<button

class="ml-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold disabled:opacity-60"

:disabled="exporting"

@click="exportAllPng"

>

{{ exporting ? "書き出し中…" : `PNG保存（全${pagesHtml.length}枚）` }}

</button>

</div>

</div>

</header>



<main class="max-w-6xl mx-auto p-3 grid grid-cols-1 lg:grid-cols-2 gap-3">

<!-- Editor -->

<section class="bg-white rounded-2xl border overflow-hidden">

<div class="px-4 py-2 border-b text-sm font-semibold flex items-center justify-between">

<span>Markdown</span>

<button class="text-xs px-2 py-1 rounded border" @click="paginate">再分割</button>

</div>

<textarea

v-model="md"

class="w-full h-[45dvh] lg:h-[75dvh] p-4 font-mono text-sm outline-none resize-none"

@input="schedulePaginate"

/>

</section>



<!-- Preview -->

<section class="bg-white rounded-2xl border overflow-hidden">

<div class="px-4 py-2 border-b text-sm font-semibold">

プレビュー（1枚目） / 全{{ pagesHtml.length }}枚

</div>



<div class="p-3 overflow-auto">

<div class="flex justify-center">

<!-- 表示はそのまま実寸（でかいのでoverflowで見れる） -->

<div

ref="pageCaptureRef"

class="shadow-xl rounded-xl overflow-hidden"

:style="pageStyle()"

>

<div class="md-body" v-html="pagesHtml[0] || fullHtml"></div>

</div>

</div>



<p class="mt-3 text-xs text-slate-500">

分割は「段落/見出し/リストなどのブロック単位」で行います。長すぎるコードブロック等は1ブロックで溢れる可能性があります。

</p>

</div>

</section>

</main>



<!-- 隠し：ページ分割の計測用（同じスタイルで高さ判定する） -->

<div class="fixed -left-[99999px] top-0 opacity-0 pointer-events-none">

<div ref="measureWrapRef" class="overflow-hidden" :style="pageStyle()">

<div ref="measureContentRef"></div>

</div>

</div>



<!-- スマホ用：下部固定の保存ボタン（押しやすい） -->

<div class="lg:hidden fixed bottom-3 left-3 right-3">

<button

class="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold shadow-lg disabled:opacity-60"

:disabled="exporting"

@click="exportAllPng"

>

{{ exporting ? "書き出し中…" : `PNG保存（全${pagesHtml.length}枚）` }}

</button>

</div>

<div class="h-20 lg:hidden"></div>

</div>

</template>
