import { describe, expect, it } from "vitest";
import { sampleMarkdown } from "./sampleMarkdown";

describe("sampleMarkdown", () => {
  it("includes a title and secondary headers", () => {
    expect(sampleMarkdown).toContain("# Markdown to Image");
    expect(sampleMarkdown).toContain("## Text Styling");
    expect(sampleMarkdown).toContain("## Tables");
  });
});
