import { describe, expect, it } from "vitest";
import { sampleMarkdown } from "./sampleMarkdown";

describe("sampleMarkdown", () => {
  it("includes a title and body text", () => {
    expect(sampleMarkdown).toContain("# Title");
    expect(sampleMarkdown).toContain("## Body");
  });
});
