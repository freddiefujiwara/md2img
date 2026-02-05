import { describe, expect, it } from "vitest";
import { uiText } from "./uiText";

describe("uiText", () => {
  it("provides simple english labels", () => {
    expect(uiText.backgroundLabel).toBe("Background");
    expect(uiText.textColorLabel).toBe("Text color");
    expect(uiText.textSizeLabel).toBe("Text size");
    expect(uiText.lineHeightLabel).toBe("Line height");
    expect(uiText.savePngLabel).toBe("Save PNG");
  });

  it("formats page count label", () => {
    expect(uiText.pageCountLabel(1)).toBe("Total 1 page");
    expect(uiText.pageCountLabel(2)).toBe("Total 2 pages");
  });
});
