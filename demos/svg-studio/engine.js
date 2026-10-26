const palettes = {
  lavender: {
    backgroundLight: "#d7cdf5",
    backgroundMid: "#aa9bf0",
    backgroundDark: "#7864d7",
    primary: "#f9ecb0",
    secondary: "#f9a3aa",
    ink: "#181817",
    paper: "#ffffff",
  },
  peach: {
    backgroundLight: "#fdd7b9",
    backgroundMid: "#fac896",
    backgroundDark: "#d27532",
    primary: "#f9ecb0",
    secondary: "#80dada",
    ink: "#181817",
    paper: "#ffffff",
  },
  aqua: {
    backgroundLight: "#beebeb",
    backgroundMid: "#80dada",
    backgroundDark: "#5abebe",
    primary: "#ffd4f2",
    secondary: "#6d7bfc",
    ink: "#181817",
    paper: "#ffffff",
  },
};
// These names remain globals because the editor loads this file as a classic script.
const normalize = (text) => text.toLowerCase().replaceAll("ё", "е").trim();
const paletteColorKeys = Object.keys(palettes.lavender);
const backgroundColorKeys = [
  "backgroundLight",
  "backgroundMid",
  "backgroundDark",
];
const objectColorKeys = ["primary", "secondary", "ink"];

function validatePalette(palette) {
  if (!palette || typeof palette !== "object" || Array.isArray(palette)) {
    throw Error("Нужна палитра с цветами в формате #RRGGBB");
  }
  for (const key of paletteColorKeys) {
    if (
      typeof palette[key] !== "string" ||
      !/^#[0-9a-f]{6}$/i.test(palette[key])
    ) {
      throw Error(`Нужен цвет ${key} в формате #RRGGBB`);
    }
  }
  const backgroundColors = backgroundColorKeys.map((key) =>
    normalize(palette[key]),
  );
  const objectColors = objectColorKeys.map((key) => normalize(palette[key]));
  if (backgroundColors.some((color) => objectColors.includes(color))) {
    throw Error("Цвета главных объектов не должны входить в фоновую палитру");
  }
  return true;
}

function matchesAssetKeyword(token, keyword) {
  const normalizedKeyword = normalize(keyword);
  const tokenStem = token.slice(0, -2);
  // Lightweight Russian inflection matching, not a general language model.
  return (
    normalizedKeyword.includes(token) ||
    token.includes(normalizedKeyword) ||
    (tokenStem.length > 2 && normalizedKeyword.startsWith(tokenStem)) ||
    (token.length >= 4 &&
      normalizedKeyword.length >= 4 &&
      normalizedKeyword.slice(0, 3) === token.slice(0, 3))
  );
}

function scoreAsset(tokens, asset) {
  const keywords = [asset.name, ...asset.tags];
  let score = 0;
  for (const token of tokens) {
    // A token counts once even when it matches several of the asset's tags.
    if (keywords.some((keyword) => matchesAssetKeyword(token, keyword)))
      score += 1;
  }
  return score;
}

function chooseAssets(prompt, library) {
  const tokens = normalize(prompt)
    .split(/[^а-яa-z0-9]+/)
    .filter((token) => token.length > 2);
  return library
    .map((asset, index) => ({ asset, index, score: scoreAsset(tokens, asset) }))
    .filter((match) => match.score > 0)
    .sort(
      (first, second) =>
        second.score - first.score || first.index - second.index,
    )
    .map((match) => match.asset);
}
