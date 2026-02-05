/**
 * Decodes markdown text from a URL path.
 * @param {string|string[]} encodedValue - The encoded value from the route.
 * @returns {string} The decoded markdown text.
 */
export const decodeMarkdownFromPath = (encodedValue) => {
  if (!encodedValue) return "";
  const encoded = Array.isArray(encodedValue) ? encodedValue.join("/") : encodedValue;
  try {
    return decodeURIComponent(encoded);
  } catch (error) {
    console.error("Failed to decode markdown from path:", error);
    return "";
  }
};

/**
 * Encodes markdown text into a URL path.
 * @param {string} value - The markdown text to encode.
 * @returns {string} The encoded URL path.
 */
export const encodeMarkdownToPath = (value) => {
  return value ? `/${encodeURIComponent(value)}` : "/";
};
