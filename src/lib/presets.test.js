import { describe, expect, it } from "vitest";
import { imagePresets, resolvePreset, textColorPresets } from "./presets";

describe("resolvePreset", () => {
  it("returns the matching preset when key exists", () => {
    const result = resolvePreset(imagePresets, "x");

    expect(result.key).toBe("x");
    expect(result.preset).toBe(imagePresets.x);
  });

  it("falls back to the provided fallback key", () => {
    const result = resolvePreset(imagePresets, "missing", "fb");

    expect(result.key).toBe("fb");
    expect(result.preset).toBe(imagePresets.fb);
  });

  it("falls back to the first preset when no key matches", () => {
    const presets = { first: { label: "First", width: 1, height: 2 } };
    const result = resolvePreset(presets, "missing");

    expect(result.key).toBe("first");
    expect(result.preset).toBe(presets.first);
  });

  it("throws for invalid preset collections", () => {
    expect(() => resolvePreset(null, "x")).toThrow("presets");
  });
});

describe("textColorPresets", () => {
  it("contains labeled color presets", () => {
    expect(textColorPresets.length).toBeGreaterThan(0);
    for (const option of textColorPresets) {
      expect(option.label).toBeTruthy();
      expect(option.value).toMatch(/^#/);
    }
  });
});
