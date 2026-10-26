/* Слойра — © 2026 Павлович Александр Кириллович / dobropalm. Code: MIT. Artwork: ASSET-NOTICE.md. */
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
  book: ["книга", "книги", "книгу", "книгой", "книг", "книжка", "книжки", "книгам", "книгами", "книгах", "книге"],
  phone: ["телефон", "телефона", "телефоны", "телефоном", "смартфон", "смартфоны", "телефону", "телефоне", "телефонов", "телефонами", "смартфона", "смартфоном"],
  puzzle: ["пазл", "пазлы", "пазлов", "пазла", "пазлами", "пазлу", "пазлом", "пазлах"],
  coin: ["монета", "монеты", "монету", "монет", "монетой", "монете", "монетами", "монетах"],
  headphones: ["наушники", "наушников", "наушниками", "наушникам", "наушниках"],
  lamp: ["лампа", "лампы", "лампу", "лампой", "лампочка", "лампочки", "лампе", "лампами", "лампах"],
  plant: ["растение", "растения", "растений", "растением", "цветок", "цветы", "цветами", "растению", "растениями", "цветка", "цветком", "цветов", "цветочки", "букет", "букета", "букеты", "тюльпаны", "тюльпанов"],
  folder: ["папка", "папки", "папку", "папкой", "папок", "папке", "папками", "папках"],
  pen: ["ручка", "ручки", "ручку", "ручкой", "ручек", "ручке", "ручками", "ручках"],
  wallet: ["кошелек", "кошелька", "кошельки", "кошельком", "кошельков", "кошельку", "кошельке", "кошельками", "кошельках"],
};
const meaningRules = [
  { terms: ["преград", "препятств", "преодол", "трудност", "вызов", "мечт", "цели", "цель"], ids: ["puzzle", "plant", "lamp"] },
  { terms: ["за столом", "на столе", "рабочее место", "рабочий стол", "рабочего стола", "на рабочем столе", "на письменном столе", "на полке", "кабинет", "готовлюсь к экзамену"], ids: ["lamp", "book", "plant"] },
  { terms: ["чтени", "читаю", "читает", "библиотек"], ids: ["book", "lamp", "plant"] },
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

const intentWords = (text) => normalize(text).match(/[а-яa-z0-9]+/g) || [];

// Index whole token sequences, including names of user-imported SVGs. Keeping
// spans lets list parsing distinguish its «и» separator from «и» inside a name.
function componentMatcher(catalogue) {
  const phrases = catalogue.flatMap((asset, catalogueIndex) =>
    (componentForms[asset.id] || [asset.name]).map((phrase) => ({
      asset, catalogueIndex, tokens: intentWords(phrase),
    })).filter(({ tokens }) => tokens.length));
  return (words) => {
    const candidates = phrases.flatMap(({ asset, catalogueIndex, tokens }) =>
      words.flatMap((_, position) => tokens.every((token, offset) =>
        words[position + offset] === token)
        ? [{ asset, catalogueIndex, position, length: tokens.length }] : []))
      .sort((a, b) => a.position - b.position || b.length - a.length ||
        a.catalogueIndex - b.catalogueIndex);
    // A complete imported name owns its words: «Красная книга» must not also
    // insert the built-in book. Prefer the longest phrase at each position.
    let end = 0;
    return candidates.filter((match) => {
      if (match.position < end) return false;
      end = match.position + match.length;
      return true;
    });
  };
}

function componentListParts(text, matchComponents) {
  // Commas, semicolons and newlines always delimit items. A conjunction may be
  // part of an imported illustration's name, so split only outside its span.
  return text.split(/[,;\n]+/).flatMap((part) => {
    const tokens = [...part.matchAll(/[а-яa-z0-9]+/g)];
    const matches = matchComponents(tokens.map(([word]) => word));
    const separators = tokens.filter(([word], index) => word === "и" &&
      !matches.some(({ position, length }) => index >= position && index < position + length));
    let start = 0;
    const parts = separators.map((separator) => {
      const item = part.slice(start, separator.index);
      start = separator.index + separator[0].length;
      return item;
    });
    return [...parts, part.slice(start)];
  }).map((part) => part.trim()).filter(Boolean);
}

const countWords = {
  один: 1, одна: 1, одно: 1, одну: 1, два: 2, две: 2, двумя: 2, двух: 2, пару: 2, пара: 2,
  три: 3, тремя: 3, трех: 3, четыре: 4, пять: 5, шесть: 6, семь: 7, восемь: 8, девять: 9, десять: 10,
  ноль: 0,
};
function placementFromWords(words) {
  const text = words.join(" ");
  const result = {};
  if (/слева|слева от|левом|левый/.test(text)) result.x = .2;
  if (/справа|правом|правый/.test(text)) result.x = .8;
  if (/сверху|вверху|верхнем|верхний/.test(text)) result.y = .25;
  if (/снизу|внизу|нижнем|нижний/.test(text)) result.y = .75;
  if (/посередине|посредине|по середине|по центру|в центре/.test(text)) {
    result.x ??= .5;
    result.y ??= .5;
  }
  return result;
}

function parseComposition(prompt, catalogue) {
  const text = normalize(prompt);
  const words = intentWords(text);
  const matchComponents = componentMatcher(catalogue);
  const matches = matchComponents(words);
  const surface = /(?:за столом|на (?:рабочем |письменном )?столе|рабочий стол|рабочего стола)/.test(text) ? "table" : null;
  if (matches.length) {
    const parts = componentListParts(text, matchComponents);
    const unknown = parts.length > 1 ? parts.filter((part) =>
      matchComponents(intentWords(part)).length === 0) : [];
    const assets = [], layout = [], seen = new Set();
    let tooMany = false;
    for (let index = 0; index < matches.length; index++) {
      const match = matches[index];
      const before = words.slice(index ? matches[index - 1].position + matches[index - 1].length : 0, match.position);
      // Counts belong to the immediately following noun, never a previous item.
      const amountWord = before.at(-1);
      const count = countWords[amountWord] ?? (/^\d+$/.test(amountWord || "") ? Number(amountWord) : null);
      const negated = before.at(-1) === "без" || before.at(-1) === "не" ||
        before.slice(-2).includes("без") || before.slice(-2).includes("не");
      if (negated || count === 0) continue;
      if (count == null && seen.has(match.asset.id)) continue;
      seen.add(match.asset.id);
      const next = matches[index + 1];
      const after = words.slice(match.position + match.length, next?.position ?? words.length);
      // A comma/conjunction closes the previous object's instruction.
      const tail = after.slice(0, after.indexOf("и") < 0 ? after.length : after.indexOf("и"));
      const directive = placementFromWords(tail);
      const amount = count ?? 1;
      if (!Number.isSafeInteger(amount) || amount > 100 || assets.length + amount > 100) {
        tooMany = true;
        continue;
      }
      for (let copy = 0; copy < amount; copy++) {
        assets.push(match.asset);
        layout.push(directive);
      }
    }
    return { mode: "components", assets, layout, unknown, tooMany, surface };
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
  return { mode: "meaning", assets, unknown: [], surface };
}

// Automatic layout, touch gestures and buttons share portable transform bounds.
function clampObjectScale(value) {
  return Math.max(0.2, Math.min(3, value));
}
function normalizeObjectRotation(value) {
  return ((value + 180) % 360 + 360) % 360 - 180;
}

// A row/grid keeps longer explicit lists inside the canvas instead of overlapping
// ten full-sized illustrations in the former three-item layout.
function compositionPositions(count, width, height, directives = [], surface = null) {
  const columns = count <= 3 ? count : Math.ceil(Math.sqrt(count * width / height));
  const rows = Math.ceil(count / columns);
  const scale = count === 1 ? 1.5 : count <= 3 ? 1.05 : clampObjectScale(Math.min(1, 2.4 / columns, 1.8 / rows));
  const positions = Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / columns);
    const inRow = Math.min(columns, count - row * columns);
    return {
      x: width * ((index % columns) + 1) / (inRow + 1),
      y: rows === 1 ? height * (surface === "table" ? .56 : index % 2 ? .46 : .57) : height * (row + 1) / (rows + 1),
      rotation: surface === "table" ? 0 : index % 2 ? 7 : -5,
      scale: surface === "table" ? clampObjectScale(Math.min(scale, width / (columns * 320))) : scale,
    };
  });
  const available = new Set(positions.map((_, i) => i));
  const result = new Array(count);
  const groups = new Map();
  directives.forEach((d, i) => {
    if (i >= count || (d.x == null && d.y == null)) return;
    const key = `${d.x ?? .5},${d.y ?? .5}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(i);
  });
  for (const indexes of groups.values()) {
    indexes.forEach((index, offset) => {
      const d = directives[index];
      const columns = Math.ceil(Math.sqrt(indexes.length));
      const rows = Math.ceil(indexes.length / columns);
      const spread = Math.min(width, height) * .22;
      const x = width * (d.x ?? .5) + ((offset % columns) - (columns - 1) / 2) * spread / columns;
      const y = height * (d.y ?? .5) + (Math.floor(offset / columns) - (rows - 1) / 2) * spread / rows;
      const nearest = [...available].sort((a,b) =>
        Math.hypot(positions[a].x-x, positions[a].y-y) - Math.hypot(positions[b].x-x, positions[b].y-y))[0];
      available.delete(nearest);
      result[index] = { ...positions[index], x, y,
        scale: indexes.length > 1 ? clampObjectScale(Math.min(positions[index].scale, .65 / columns)) : positions[index].scale };
    });
  }
  // Preserve explicit anchors, fill all other objects from unoccupied layout slots.
  for (let index = 0; index < count; index++) {
    if (result[index]) continue;
    const slot = available.values().next().value;
    available.delete(slot);
    result[index] = positions[slot];
  }
  return result;
}

function chooseAssets(prompt, catalogue) {
  return planComposition(prompt, catalogue).assets;
}
