import LZString from "lz-string";

/**
 * Decodes markdown text from a URL path.
 * @param {string|string[]} encodedValue - The encoded value from the route.
 * @returns {string} The decoded markdown text.
 */
export const decodeMarkdownFromPath = (encodedValue) => {
  if (!encodedValue) return "";
  const encoded = Array.isArray(encodedValue) ? encodedValue.join("/") : encodedValue;
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(encoded);
    // lz-string returns null or sometimes an empty string for invalid inputs.
    // The compressed version of an empty string in compressToEncodedURIComponent is "Q".
    if (decompressed !== null && (decompressed !== "" || encoded === "Q")) {
      return decompressed;
    }
    // Fallback to old method for backward compatibility
    return decodeURIComponent(encoded);
  } catch (error) {
    try {
      // Final attempt with old method if LZString fails
      return decodeURIComponent(encoded);
    } catch (e) {
      console.error("Failed to decode markdown from path:", error);
      return "";
    }
  }
};

/**
 * Encodes markdown text into a URL path.
 * @param {string} value - The markdown text to encode.
 * @returns {string} The encoded URL path.
 */
export const encodeMarkdownToPath = (value) => {
  if (!value) return "/";
  const compressed = LZString.compressToEncodedURIComponent(value);
  return `/${compressed}`;
};
