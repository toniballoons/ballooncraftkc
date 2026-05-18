const NAMED_COLORS = {
  black: "#000000",
  transparent: "rgba(255,255,255,0)",
  white: "#ffffff",
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeHex(hex) {
  const value = hex.replace("#", "").trim();
  if (value.length === 3) {
    return value.split("").map((char) => char + char).join("");
  }
  if (value.length === 4) {
    return value
      .split("")
      .map((char) => char + char)
      .join("")
      .slice(0, 6);
  }
  if (value.length >= 6) {
    return value.slice(0, 6);
  }
  return null;
}

function parseHexColor(hex) {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function parseRgbChannel(value) {
  if (value.endsWith("%")) {
    return clamp(Math.round((parseFloat(value) / 100) * 255), 0, 255);
  }
  return clamp(Math.round(parseFloat(value)), 0, 255);
}

function parseRgbColor(color) {
  const match = color.match(/rgba?\(([^)]+)\)/i);
  if (!match) return null;
  const channels = match[1].split(",").map((part) => part.trim());
  if (channels.length < 3) return null;

  return {
    r: parseRgbChannel(channels[0]),
    g: parseRgbChannel(channels[1]),
    b: parseRgbChannel(channels[2]),
  };
}

function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp(s / 100, 0, 1);
  const light = clamp(l / 100, 0, 1);

  if (sat === 0) {
    const channel = Math.round(light * 255);
    return { r: channel, g: channel, b: channel };
  }

  const chroma = (1 - Math.abs(2 * light - 1)) * sat;
  const segment = hue / 60;
  const x = chroma * (1 - Math.abs((segment % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (segment >= 0 && segment < 1) [r1, g1, b1] = [chroma, x, 0];
  else if (segment < 2) [r1, g1, b1] = [x, chroma, 0];
  else if (segment < 3) [r1, g1, b1] = [0, chroma, x];
  else if (segment < 4) [r1, g1, b1] = [0, x, chroma];
  else if (segment < 5) [r1, g1, b1] = [x, 0, chroma];
  else [r1, g1, b1] = [chroma, 0, x];

  const match = light - chroma / 2;
  return {
    r: Math.round((r1 + match) * 255),
    g: Math.round((g1 + match) * 255),
    b: Math.round((b1 + match) * 255),
  };
}

function parseHslColor(color) {
  const match = color.match(/hsla?\(([^)]+)\)/i);
  if (!match) return null;
  const channels = match[1].split(",").map((part) => part.trim().replace("%", ""));
  if (channels.length < 3) return null;

  return hslToRgb(parseFloat(channels[0]), parseFloat(channels[1]), parseFloat(channels[2]));
}

function parseColor(color) {
  if (!color || typeof color !== "string") return null;

  const normalized = NAMED_COLORS[color.trim().toLowerCase()] || color.trim();
  if (normalized.startsWith("#")) return parseHexColor(normalized);
  if (/^rgba?\(/i.test(normalized)) return parseRgbColor(normalized);
  if (/^hsla?\(/i.test(normalized)) return parseHslColor(normalized);
  return null;
}

function extractColors(background) {
  if (!background || typeof background !== "string") return [];

  const matches = background.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|\b(?:white|black|transparent)\b/g);
  if (!matches) {
    const parsed = parseColor(background);
    return parsed ? [parsed] : [];
  }

  return matches.map(parseColor).filter(Boolean);
}

function averageColor(colors) {
  if (!colors.length) {
    return { r: 255, g: 255, b: 255 };
  }

  const sum = colors.reduce(
    (acc, color) => ({
      r: acc.r + color.r,
      g: acc.g + color.g,
      b: acc.b + color.b,
    }),
    { r: 0, g: 0, b: 0 },
  );

  return {
    r: Math.round(sum.r / colors.length),
    g: Math.round(sum.g / colors.length),
    b: Math.round(sum.b / colors.length),
  };
}

function channelToLinear(channel) {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(color) {
  return (
    0.2126 * channelToLinear(color.r) +
    0.7152 * channelToLinear(color.g) +
    0.0722 * channelToLinear(color.b)
  );
}

function contrastRatio(colorA, colorB) {
  const luminanceA = relativeLuminance(colorA);
  const luminanceB = relativeLuminance(colorB);
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
}

function resolveBackgroundColor(background) {
  return averageColor(extractColors(background));
}

export function ensureAccessibleColor(
  preferredColor,
  background,
  {
    fallbackDark = "#111827",
    fallbackLight = "#ffffff",
    minRatio = 4.5,
  } = {},
) {
  const backgroundColor = resolveBackgroundColor(background);
  const preferred = parseColor(preferredColor);

  if (preferred && contrastRatio(preferred, backgroundColor) >= minRatio) {
    return preferredColor;
  }

  const lightContrast = contrastRatio(parseColor(fallbackLight), backgroundColor);
  const darkContrast = contrastRatio(parseColor(fallbackDark), backgroundColor);
  return lightContrast >= darkContrast ? fallbackLight : fallbackDark;
}

export function getHeroTextStyles(background) {
  const textColor = ensureAccessibleColor("#ffffff", background);
  const isLightText = textColor.toLowerCase() === "#ffffff";

  return {
    textColor,
    mutedTextColor: isLightText ? "rgba(255,255,255,0.92)" : "rgba(17,24,39,0.86)",
    panelStyle: {
      backgroundColor: isLightText ? "rgba(15,23,42,0.46)" : "rgba(255,255,255,0.82)",
      boxShadow: isLightText
        ? "0 12px 40px rgba(15,23,42,0.18)"
        : "0 12px 40px rgba(15,23,42,0.1)",
    },
  };
}
