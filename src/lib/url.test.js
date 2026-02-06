import { describe, it, expect } from "vitest";
import { decodeMarkdownFromPath, encodeMarkdownToPath } from "./url";
import LZString from "lz-string";

describe("url utilities", () => {
  it("encodes markdown using lz-string", () => {
    const markdown = "# Hello World";
    const encoded = encodeMarkdownToPath(markdown);
    // MQAgEgpgNlD2IHVYCcoBMg is the lz-string compressed version of "# Hello World"
    expect(encoded).toBe("/MQAgEgpgNlD2IHVYCcoBMg");
  });

  it("decodes compressed markdown path", () => {
    const encoded = "MQAgEgpgNlD2IHVYCcoBMg";
    const decoded = decodeMarkdownFromPath(encoded);
    expect(decoded).toBe("# Hello World");
  });

  it("decodes legacy URL path (backward compatibility)", () => {
    const legacyEncoded = "%23%20Hello%20World";
    const decoded = decodeMarkdownFromPath(legacyEncoded);
    expect(decoded).toBe("# Hello World");
  });

  it("handles empty values", () => {
    expect(encodeMarkdownToPath("")).toBe("/");
    expect(decodeMarkdownFromPath("")).toBe("");
  });

  it("handles array encoded values (vue-router behavior)", () => {
    // Note: If vue-router splits the path, it might be tricky for LZString if it splits in the middle of a compressed string.
    // However, our current router setup is `/:encoded(.*)` which should ideally capture it as one string,
    // but if it contains slashes (which LZString's compressToEncodedURIComponent shouldn't) it might get split.
    // Let's test how it handles combined array values.
    const markdown = "Part 1 / Part 2";
    const compressed = LZString.compressToEncodedURIComponent(markdown);

    // Simulating how vue-router might pass it if there were slashes (though there shouldn't be)
    const encodedArray = [compressed];
    const decoded = decodeMarkdownFromPath(encodedArray);
    expect(decoded).toBe(markdown);
  });

  it("handles null or undefined input", () => {
    expect(decodeMarkdownFromPath(null)).toBe("");
    expect(decodeMarkdownFromPath(undefined)).toBe("");
  });

  it("handles invalid LZString and invalid URI encoding gracefully", () => {
    // A string that is not LZString and has invalid % encoding (e.g. % at the end)
    const invalid = "some-string-%";
    expect(decodeMarkdownFromPath(invalid)).toBe("");
  });

  it("handles empty string compression (special case 'Q')", () => {
    expect(decodeMarkdownFromPath("Q")).toBe("");
  });
});
