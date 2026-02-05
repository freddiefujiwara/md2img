export const defaultFontStack =
  "system-ui, -apple-system, 'Hiragino Sans', 'Noto Sans JP', 'Yu Gothic', 'Meiryo', sans-serif";

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

  return {
    width: `${preset.width}px`,
    height: `${preset.height}px`,
    background: backgroundColor,
    color: textColor,
    fontSize: `${fontSize}px`,
    lineHeight: String(lineHeight),
    padding: `${padding}px`,
    fontFamily,
  };
}
