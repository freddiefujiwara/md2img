export const defaultFontStack =
  "system-ui, -apple-system, 'Hiragino Sans', 'Noto Sans JP', 'Yu Gothic', 'Meiryo', sans-serif";

const fallbackRgb = { r: 15, g: 23, b: 42 };

const hexToRgb = (value) => {
  if (!value || typeof value !== "string") return null;
  const normalized = value.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{3}$/.test(normalized) && !/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }
  const hex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  const int = Number.parseInt(hex, 16);
  if (Number.isNaN(int)) return null;
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
};

const buildRgba = (rgb, alpha) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;

export function buildPageStyle({
  preset,
  backgroundColor,
  textColor,
  fontSize,
  lineHeight,
  padding,
  fontFamily = defaultFontStack,
}) {
  if (!preset) {
    throw new Error("preset is required to build page style");
  }

  const rgb = hexToRgb(textColor) || fallbackRgb;

  return {
    width: `${preset.width}px`,
    height: `${preset.height}px`,
    background: backgroundColor,
    color: textColor,
    fontSize: `${fontSize}px`,
    lineHeight: String(lineHeight),
    padding: `${padding}px`,
    fontFamily,
    "--md-color-06": buildRgba(rgb, 0.06),
    "--md-color-15": buildRgba(rgb, 0.15),
    "--md-color-78": buildRgba(rgb, 0.78),
  };
}
