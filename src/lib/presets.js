export const imagePresets = {
  x: { label: "X (1200×675)", width: 1200, height: 675 },
  ig_post: { label: "Instagram Post (1080×1080)", width: 1080, height: 1080 },
  ig_story: { label: "Instagram Story (1080×1920)", width: 1080, height: 1920 },
  fb: { label: "Facebook (1200×630)", width: 1200, height: 630 },
};

export const textColorPresets = [
  { label: "Black", value: "#0f172a" },
  { label: "Maroon", value: "#7f1d1d" },
  { label: "White", value: "#f8fafc" },
  { label: "Light Green", value: "#dcfce7" },
];

export function resolvePreset(presets, key, fallbackKey) {
  if (!presets || typeof presets !== "object") {
    throw new Error("presets must be an object");
  }

  if (key && presets[key]) {
    return { key, preset: presets[key] };
  }

  if (fallbackKey && presets[fallbackKey]) {
    return { key: fallbackKey, preset: presets[fallbackKey] };
  }

  const [firstKey] = Object.keys(presets);
  return { key: firstKey, preset: presets[firstKey] };
}
