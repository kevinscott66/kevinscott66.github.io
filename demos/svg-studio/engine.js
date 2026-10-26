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

// Intent matching stays local: concepts refer only to existing catalogue IDs.
// Word boundaries avoid the old three-letter collisions (e.g. «лампа»/«лампочка»
// is explicit, whereas an unrelated word sharing three letters is not).
const componentForms = {
  book: ["книга", "книги", "книгу", "книгой", "книг", "книжка", "книжки"],
  phone: ["телефон", "телефона", "телефоны", "телефоном", "смартфон", "смартфоны"],
  puzzle: ["пазл", "пазлы", "пазлов", "пазла", "пазлами"],
  coin: ["монета", "монеты", "монету", "монет", "монетой"],
  headphones: ["наушники", "наушников", "наушниками"],
  lamp: ["лампа", "лампы", "лампу", "лампой", "лампочка", "лампочки"],
  plant: ["растение", "растения", "растений", "растением", "цветок", "цветы", "цветами"],
  folder: ["папка", "папки", "папку", "папкой", "папок"],
  pen: ["ручка", "ручки", "ручку", "ручкой", "ручек"],
  wallet: ["кошелек", "кошелька", "кошельки", "кошельком", "кошельков"],
};
const meaningRules = [
  { terms: ["преград", "препятств", "преодол", "трудност", "вызов", "мечт", "цели", "цель"], ids: ["puzzle", "plant", "lamp"] },
  { terms: ["знани", "обуч", "учить", "учим", "учеб", "образован", "исследован", "позна", "мудрост"], ids: ["book", "lamp", "plant"] },
  { terms: ["иде", "вдохнов", "озарен", "творче", "изобрет", "инновац"], ids: ["lamp", "pen", "puzzle"] },
  { terms: ["команд", "сотруднич", "вместе", "единств", "партнер", "объедин"], ids: ["puzzle", "phone", "plant"] },
  { terms: ["финанс", "деньг", "бюджет", "инвест", "накоп", "сбереж", "доход", "капитал", "богатств"], ids: ["coin", "wallet", "plant"] },
  { terms: ["безопас", "защит", "сохран", "надежност"], ids: ["wallet", "folder", "puzzle"] },
  { terms: ["связ", "общен", "разговор", "сообщен", "дистанц", "онлайн", "цифров", "технолог"], ids: ["phone", "puzzle", "headphones"] },
  { terms: ["музык", "отдых", "пауз", "тишин", "гармони", "слуш", "звук", "подкаст", "перезагруз"], ids: ["headphones", "plant"] },
  { terms: ["поряд", "документ", "организац", "хаос", "архив", "планир", "план", "продуктив"], ids: ["folder", "pen", "lamp"] },
  { terms: ["рост", "развит", "будущ", "новый старт", "начало", "жизн", "забот", "природ", "эколог"], ids: ["plant", "book", "lamp"] },
];

function planComposition(prompt, catalogue) {
  const text = normalize(prompt);
  const words = text.match(/[а-яa-z0-9]+/g) || [];
  const named = [];
  words.forEach((word) => {
    catalogue.forEach((asset) => {
      const forms = componentForms[asset.id] || [normalize(asset.name)];
      if (forms.includes(word) && !named.includes(asset)) named.push(asset);
    });
  });
  if (named.length) {
    // In a delimited list, every component must resolve; never silently omit one.
    const parts = text.split(/[,;\n]+|\s+и\s+/).filter((part) => part.trim());
    const unknown = parts.length > 1 ? parts.filter((part) => {
      const tokens = part.match(/[а-яa-z0-9]+/g) || [];
      return !named.some((asset) => tokens.some((token) =>
        (componentForms[asset.id] || [normalize(asset.name)]).includes(token)));
    }).map((part) => part.trim()) : [];
    return { mode: "components", assets: named, unknown };
  }
  const scores = new Map();
  meaningRules.forEach((rule) => {
    const hits = rule.terms.filter((term) => term.includes(" ")
      ? text.includes(term) : words.some((word) => word.startsWith(term))).length;
    if (!hits) return;
    rule.ids.forEach((id, index) => scores.set(id,
      (scores.get(id) || 0) + hits * (3 - index)));
  });
  const assets = catalogue.map((asset, index) => ({asset, index, score: scores.get(asset.id) || 0}))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 3).map((match) => match.asset);
  return { mode: "meaning", assets, unknown: [] };
}

// A row/grid keeps longer explicit lists inside the canvas instead of overlapping
// ten full-sized illustrations in the former three-item layout.
function compositionPositions(count, width, height) {
  const columns = count <= 3 ? count : Math.ceil(Math.sqrt(count * width / height));
  const rows = Math.ceil(count / columns);
  const scale = count === 1 ? 1.5 : count <= 3 ? 1.05 : Math.min(1, 2.4 / columns, 1.8 / rows);
  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / columns);
    const inRow = Math.min(columns, count - row * columns);
    return {
      x: width * ((index % columns) + 1) / (inRow + 1),
      y: rows === 1 ? height * (index % 2 ? 0.46 : 0.57) : height * (row + 1) / (rows + 1),
      rotation: index % 2 ? 7 : -5, scale,
    };
  });
}

function chooseAssets(prompt, catalogue) {
  return planComposition(prompt, catalogue).assets;
}
