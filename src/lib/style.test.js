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
      "--md-color-06": "rgba(0, 0, 0, 0.06)",
      "--md-color-15": "rgba(0, 0, 0, 0.15)",
      "--md-color-78": "rgba(0, 0, 0, 0.78)",
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

  it("builds color variables from 3-digit hex values", () => {
    const preset = { width: 400, height: 300 };

    const result = buildPageStyle({
      preset,
      backgroundColor: "#fff",
      textColor: "#abc",
      fontSize: 16,
      lineHeight: 1.5,
      padding: 20,
    });

    expect(result["--md-color-06"]).toBe("rgba(170, 187, 204, 0.06)");
    expect(result["--md-color-15"]).toBe("rgba(170, 187, 204, 0.15)");
    expect(result["--md-color-78"]).toBe("rgba(170, 187, 204, 0.78)");
  });
});
