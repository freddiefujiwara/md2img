import { describe, expect, it } from "vitest";
import { buildPageStyle, defaultFontStack } from "./style";

describe("buildPageStyle", () => {
  it("builds a full page style object", () => {
    const preset = { width: 300, height: 200 };

    const result = buildPageStyle({
      preset,
      backgroundColor: "#fff",
      textColor: "#000",
      fontSize: 18,
      lineHeight: 1.4,
      padding: 16,
    });

    expect(result).toEqual({
      width: "300px",
      height: "200px",
      background: "#fff",
      color: "#000",
      fontSize: "18px",
      lineHeight: "1.4",
      padding: "16px",
      fontFamily: defaultFontStack,
    });
  });

  it("throws when preset is missing", () => {
    expect(() =>
      buildPageStyle({
        preset: null,
        backgroundColor: "#fff",
        textColor: "#000",
        fontSize: 18,
        lineHeight: 1.4,
        padding: 16,
      })
    ).toThrow("preset");
  });
});
