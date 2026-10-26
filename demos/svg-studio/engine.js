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
const normalize = (s) => s.toLowerCase().replaceAll("ё", "е").trim();
function validatePalette(p) {
  for (const k of Object.keys(palettes.lavender))
    if (!/^#[\da-f]{6}$/i.test(p[k] || ""))
      throw Error(`Нужен цвет ${k} в формате #RRGGBB`);
  const bg = [p.backgroundLight, p.backgroundMid, p.backgroundDark].map(
      normalize,
    ),
    fg = [p.primary, p.secondary, p.ink].map(normalize);
  if (bg.some((c) => fg.includes(c)))
    throw Error("Цвета главных объектов не должны входить в фоновую палитру");
  return true;
}
function chooseAssets(prompt, library) {
  const tokens = normalize(prompt)
    .split(/[^а-яa-z0-9]+/)
    .filter((t) => t.length > 2);
  return library
    .map((a, i) => ({
      a,
      i,
      score: tokens.reduce(
        (sum, t) =>
          sum +
          [a.name, ...a.tags].some((k) => {
            const n = normalize(k);
            return (
              n.includes(t) ||
              t.includes(n) ||
              (t.slice(0, -2).length > 2 && n.startsWith(t.slice(0, -2))) ||
              (t.length >= 4 &&
                n.length >= 4 &&
                n.slice(0, 3) === t.slice(0, 3))
            );
          }) *
            1,
        0,
      ),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((x) => x.a);
}
