export function splitIntoBlocks(html, doc = document) {
  if (!doc?.createElement) {
    throw new Error("document is required to split HTML blocks");
  }

  const tmp = doc.createElement("div");
  tmp.innerHTML = html;
  const blocks = [];

  for (const node of tmp.childNodes) {
    if (node.nodeType === 3 && !node.textContent.trim()) continue;
    const wrap = doc.createElement("div");
    wrap.appendChild(node.cloneNode(true));
    blocks.push(wrap.innerHTML);
  }

  return blocks;
}

export function paginateHtml({ html, maxHeight, measure, doc = document }) {
  if (typeof measure !== "function") {
    throw new Error("measure function is required to paginate");
  }

  const blocks = splitIntoBlocks(html, doc);
  const pages = [];
  let current = "";

  for (const block of blocks) {
    const candidate = current + block;
    const height = measure(candidate);

    if (height > maxHeight) {
      if (!current) {
        pages.push(block);
        current = "";
      } else {
        pages.push(current);
        current = block;
      }
    } else {
      current = candidate;
    }
  }

  if (current) pages.push(current);

  return pages.length ? pages : [html];
}
