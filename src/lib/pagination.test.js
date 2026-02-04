import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";

import { paginateHtml, splitIntoBlocks } from "./pagination";

describe("splitIntoBlocks", () => {
  it("splits top-level HTML blocks and ignores empty text nodes", () => {
    const dom = new JSDOM("<!doctype html><html><body></body></html>");
    const html = "\n<h1>Title</h1>\n<p>Paragraph</p>\n";

    const blocks = splitIntoBlocks(html, dom.window.document);

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toContain("<h1>Title</h1>");
    expect(blocks[1]).toContain("<p>Paragraph</p>");
  });
});

describe("paginateHtml", () => {
  const createMeasure = () => (candidate) =>
    candidate.replace(/<[^>]*>/g, "").length;

  it("returns a single page when content fits", () => {
    const dom = new JSDOM("<!doctype html><html><body></body></html>");
    const html = "<p>123</p><p>45</p>";

    const pages = paginateHtml({
      html,
      maxHeight: 10,
      measure: createMeasure(),
      doc: dom.window.document,
    });

    expect(pages).toEqual([html]);
  });

  it("splits content when the combined height exceeds the max", () => {
    const dom = new JSDOM("<!doctype html><html><body></body></html>");
    const html = "<p>123</p><p>4567</p><p>89</p>";

    const pages = paginateHtml({
      html,
      maxHeight: 6,
      measure: createMeasure(),
      doc: dom.window.document,
    });

    expect(pages).toEqual(["<p>123</p>", "<p>4567</p><p>89</p>"]);
  });

  it("treats an oversized block as its own page", () => {
    const dom = new JSDOM("<!doctype html><html><body></body></html>");
    const html = "<p>123456</p><p>78</p>";

    const pages = paginateHtml({
      html,
      maxHeight: 5,
      measure: createMeasure(),
      doc: dom.window.document,
    });

    expect(pages).toEqual(["<p>123456</p>", "<p>78</p>"]);
  });

  it("falls back to a single page when the input is empty", () => {
    const dom = new JSDOM("<!doctype html><html><body></body></html>");
    const html = "";

    const pages = paginateHtml({
      html,
      maxHeight: 5,
      measure: createMeasure(),
      doc: dom.window.document,
    });

    expect(pages).toEqual([""]);
  });

  it("throws when measure is missing", () => {
    const dom = new JSDOM("<!doctype html><html><body></body></html>");

    expect(() =>
      paginateHtml({
        html: "<p>1</p>",
        maxHeight: 5,
        measure: null,
        doc: dom.window.document,
      })
    ).toThrow("measure");
  });
});
