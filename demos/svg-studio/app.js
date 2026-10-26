const $ = (id) => document.getElementById(id),
  NS = "http://www.w3.org/2000/svg";
let library = [],
  objects = [],
  selected = null,
  uid = 0,
  w = 800,
  h = 600,
  cache = new Map(),
  customPalette = null;
const MAX_OBJECTS = 100;
const MAX_COORDINATE = 5000;
const MAX_PROJECT_BYTES = 1000000;
const MAX_PALETTE_BYTES = 64000;
let editorReady = false;
let projectReadToken = 0;
let paletteReadToken = 0;

function setEditorLoading(loading) {
  document.querySelectorAll("button, input, select, textarea").forEach((control) => {
    control.disabled = loading;
  });
}
setEditorLoading(true);

function boundCoordinate(value) {
  return Math.max(-MAX_COORDINATE, Math.min(MAX_COORDINATE, value));
}

function canAddObject() {
  if (objects.length < MAX_OBJECTS) return true;
  $("notice").textContent = "На холсте уже 100 элементов. Удалите лишние перед добавлением.";
  return false;
}

const el = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};
function cleanSVG(text) {
  const d = new DOMParser().parseFromString(text, "image/svg+xml");
  if (
    d.querySelector("parsererror") ||
    d.documentElement.localName !== "svg" ||
    d.documentElement.namespaceURI !== NS
  )
    throw Error("Некорректный SVG");
  const root = d.documentElement;
  if (text.length > 2000000 || root.querySelectorAll("*").length > 15000)
    throw Error("SVG слишком большой");
  const allowed = new Set(
    "svg g defs path rect circle ellipse polygon polyline line text tspan use symbol title desc linearGradient radialGradient stop clipPath mask pattern filter feGaussianBlur feOffset feBlend feColorMatrix feComposite feFlood feMerge feMergeNode feComponentTransfer feFuncR feFuncG feFuncB feFuncA".split(
      " ",
    ),
  );
  for (const n of [root, ...root.querySelectorAll("*")]) {
    if (n.namespaceURI !== NS || !allowed.has(n.localName)) {
      n.remove();
      continue;
    }
    if (
      [
        "script",
        "foreignObject",
        "iframe",
        "image",
        "style",
        "animate",
        "animateTransform",
        "set",
        "a",
        "audio",
        "video",
        "embed",
        "object",
        "feImage",
      ].includes(n.localName)
    ) {
      n.remove();
      continue;
    }
    for (const attribute of [...n.attributes]) {
      const safeValue = safeSvgAttribute(attribute.name, attribute.value);
      if (safeValue === null) n.removeAttribute(attribute.name);
      else n.setAttribute(attribute.name, safeValue);
    }
  }
  const seenIds = new Set();
  for (const node of [root, ...root.querySelectorAll("[id]")]) {
    if (!node.hasAttribute("id")) continue;
    if (seenIds.has(node.id))
      throw Error("В файле повторяются идентификаторы элементов");
    seenIds.add(node.id);
  }
  return root;
}
function palette() {
  return customPalette || palettes[$("scheme").value];
}
function artwork(asset, role = "main") {
  const size = w >= 1000 ? "L" : "S";
  return cache.get(asset.variants[size]?.[role] || asset.variants.S.main);
}
const colorSlots = {
  "#d7cdf5": "backgroundLight",
  "#7864d7": "backgroundDark",
  "#aa9bf0": "backgroundMid",
  "#f9ecb0": "primary",
  "#f9a3aa": "secondary",
  "#ffe3e1": "secondaryLight",
  "#181817": "ink",
  white: "paper",
  "#ffffff": "paper",
  "#fff": "paper",
};
// A pale secondary tint present in the supplied L artwork is derived from
// existing palette slots, so custom palettes need no additional required key.
function mixColorWithPaper(color, paper, paperWeight = 0.75) {
  const channels = [1, 3, 5].map((offset) => {
    const base = parseInt(color.slice(offset, offset + 2), 16);
    const light = parseInt(paper.slice(offset, offset + 2), 16);
    return Math.round(base * (1 - paperWeight) + light * paperWeight)
      .toString(16)
      .padStart(2, "0");
  });
  return `#${channels.join("")}`;
}

// Figma IDs may contain whitespace or non-ASCII labels. Export instance IDs
// remain portable, and every local fragment reference follows the same mapping.
function rewriteLocalReferences(value, ids, attributeName) {
  const isHref = attributeName === "href" || attributeName === "xlink:href";
  const directId = isHref && value.startsWith("#") ? ids.get(value.slice(1)) : null;
  if (directId) return `#${directId}`;
  return value.replace(
    /url\(\s*(['"]?)#(.*?)\1\s*\)/g,
    (reference, quote, id) =>
      ids.has(id) ? `url(#${ids.get(id)})` : reference,
  );
}

function cloneArtwork(asset, role, prefix) {
  const root = artwork(asset, role).cloneNode(true),
    ids = new Map(),
    p = {
      ...palette(),
      secondaryLight: mixColorWithPaper(palette().secondary, palette().paper),
    };
  const nodes = [root, ...root.querySelectorAll("*")];
  for (const node of nodes) {
    if (node.hasAttribute("id") && !ids.has(node.id)) {
      ids.set(node.id, `${prefix}id-${ids.size}`);
    }
  }
  for (const n of nodes)
    for (const a of [...n.attributes]) {
      let v = a.value;
      if (a.name === "id") v = ids.get(v) || v;
      else {
        v = rewriteLocalReferences(v, ids, a.name);
        if (["fill", "stroke", "stop-color"].includes(a.name)) {
          const slot = colorSlots[v.toLowerCase()];
          if (slot) v = p[slot];
        }
      }
      n.setAttribute(a.name, v);
    }
  return root;
}
function add(asset, opts = {}) {
  if (!canAddObject()) return null;
  const o = {
    id: ++uid,
    asset: asset.id,
    x: w / 2,
    y: h / 2,
    rotation: 0,
    scale: 1,
    role: "main",
    ...opts,
  };
  o.x = boundCoordinate(o.x);
  o.y = boundCoordinate(o.y);
  objects.push(o);
  selected = o.id;
  return o;
}
function renderLibrary() {
  const q = normalize($("search").value);
  $("library").replaceChildren();
  for (const a of library.filter((a) =>
    normalize(a.name + " " + a.tags.join(" ")).includes(q),
  )) {
    const b = document.createElement("button");
    b.title = a.tags.join(", ");
    b.append(
      cloneArtwork(a, "main", `preview-${a.id}-`),
      document.createTextNode(a.name),
    );
    b.onclick = () => {
      add(a);
      render();
    };
    $("library").append(b);
  }
}
function renderCanvas() {
  const canvas = $("canvas");
  canvas.replaceChildren();
  canvas.setAttribute("viewBox", `0 0 ${w} ${h}`);
  canvas.style.background = $("background").value;
  for (const o of objects) {
    const a = library.find((a) => a.id === o.asset);
    if (!a) continue;
    const g = el("g", {
        "data-object": o.id,
        transform: `translate(${o.x} ${o.y}) rotate(${o.rotation}) scale(${o.scale})`,
      }),
      svg = cloneArtwork(a, o.role, `o${o.id}-`);
    svg.setAttribute("x", -120);
    svg.setAttribute("y", -120);
    svg.setAttribute("width", 240);
    svg.setAttribute("height", 240);
    g.append(svg);
    if (o.id === selected)
      g.append(
        el("rect", {
          x: -124,
          y: -124,
          width: 248,
          height: 248,
          fill: "none",
          stroke: "#7775ed",
          "stroke-dasharray": "5 5",
          "data-selection": "true",
        }),
      );
    canvas.append(g);
  }
  $("empty").hidden = objects.length > 0;
  $("count").textContent = `Элементов: ${objects.length}`;
}

function renderLayers() {
  $("layers").replaceChildren();
  [...objects].reverse().forEach((o) => {
    const row = document.createElement("div"),
      name = document.createElement("button");
    name.className = "layer-name";
    name.textContent = library.find((a) => a.id === o.asset)?.name || o.asset;
    name.onclick = () => {
      selected = o.id;
      render();
    };
    row.append(name);
    for (const [label, d] of [
      ["↑", 1],
      ["↓", -1],
    ]) {
      const b = document.createElement("button");
      b.textContent = label;
      b.title = d === 1 ? "На слой выше" : "На слой ниже";
      b.onclick = () => moveLayer(o, d);
      row.append(b);
    }
    $("layers").append(row);
  });
}

function renderSelection() {
  if (!editorReady) return;
  const o = selectedObject();
  $("selection").textContent =
    library.find((a) => a.id === o?.asset)?.name || "Ничего не выбрано";
  for (const prop of ["rotation", "scale", "role"]) {
    $(prop).disabled = !o;
    if (o) $(prop).value = o[prop];
  }
  $("duplicate").disabled = !o;
  $("delete").disabled = !o;
  $("export").disabled = objects.length === 0;
  $("save").disabled = objects.length === 0;
}
// A render updates all three views from the same composition state.
function render() {
  renderCanvas();
  renderLayers();
  renderSelection();
}

function selectedObject() {
  return objects.find((object) => object.id === selected);
}

function moveLayer(object, direction) {
  const index = objects.indexOf(object);
  const destination = index + direction;
  if (destination < 0 || destination >= objects.length) return;
  [objects[index], objects[destination]] = [
    objects[destination],
    objects[index],
  ];
  render();
}

for (const prop of ["rotation", "scale", "role"])
  $(prop).oninput = (e) => {
    const o = selectedObject();
    if (o) {
      o[prop] = prop === "role" ? e.target.value : Number(e.target.value);
      render();
    }
  };
$("delete").onclick = () => {
  objects = objects.filter((o) => o.id !== selected);
  selected = null;
  render();
};
$("duplicate").onclick = () => {
  const o = selectedObject();
  if (o && canAddObject()) {
    objects.push({ ...o, id: ++uid,
      x: boundCoordinate(o.x + 25), y: boundCoordinate(o.y + 25) });
    selected = uid;
    render();
  }
};
$("size").onchange = (e) => {
  const oldW = w,
    oldH = h;
  [w, h] = e.target.value.split(" × ").map(Number);
  objects.forEach((o) => {
    o.x = boundCoordinate((o.x / oldW) * w);
    o.y = boundCoordinate((o.y / oldH) * h);
  });
  renderLibrary();
  render();
};
$("background").oninput = () => {
  const p = palette();
  if (
    [p.primary, p.secondary, p.ink].some(
      (color) => color.toLowerCase() === $("background").value.toLowerCase(),
    )
  ) {
    $("notice").textContent =
      "Этот цвет используется в элементах. Выберите другой фон.";
    $("background").value = p.backgroundLight;
  }
  render();
};
$("scheme").onchange = () => {
  paletteReadToken += 1;
  projectReadToken += 1;
  customPalette = null;
  $("background").value = palette().backgroundLight;
  renderLibrary();
  render();
};
$("recolor").onclick = () => {
  renderLibrary();
  render();
};
async function importPalette(e) {
  const file = e.target.files[0];
  e.target.value = "";
  const token = ++paletteReadToken;
  projectReadToken += 1;
  if (!file) return;
  try {
    if (file.size > MAX_PALETTE_BYTES) throw Error("Файл цветов слишком большой");
    const p = JSON.parse(await file.text());
    if (token !== paletteReadToken) return;
    validatePalette(p);
    customPalette = p;
    $("background").value = p.backgroundLight;
    renderLibrary();
    render();
    $("notice").textContent = "Цвета обновлены.";
  } catch (err) {
    if (token === paletteReadToken) $("notice").textContent = err.message;
  }
}
$("palette").onchange = importPalette;
$("search").oninput = renderLibrary;
function composeFromPrompt() {
  const plan = planComposition($("prompt").value, library);
  if (plan.unknown.length) {
    $("notice").textContent = `Нет в библиотеке: ${plan.unknown.join(", ")}. Уточните список — текущая картинка сохранена.`;
    return;
  }
  if (!plan.assets.length) {
    $("notice").textContent =
      "Не удалось подобрать элементы. Опишите тему другими словами или перечислите элементы из библиотеки.";
    return;
  }
  objects = [];
  const positions = compositionPositions(plan.assets.length, w, h);
  plan.assets.forEach((asset, index) => add(asset, positions[index]));
  selected = objects.find((o) => o.role === "main")?.id;
  $("notice").textContent =
    "Готово. Можно передвинуть элементы и изменить цвета.";
  render();
}
$("compose").onclick = composeFromPrompt;

let drag = null;
function point(e) {
  const matrix = $("canvas").getScreenCTM();
  if (!matrix) return null;
  return new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
}
function moveObject(object, x, y) {
  object.x = boundCoordinate(x);
  object.y = boundCoordinate(y);
  render();
}
function finishDrag(e) {
  if (!drag || e.pointerId !== drag.pointerId) return;
  const pointerId = drag.pointerId;
  drag = null;
  if ($("canvas").hasPointerCapture(pointerId))
    $("canvas").releasePointerCapture(pointerId);
}
$("canvas").onpointerdown = (e) => {
  // One gesture owns the object until it ends; a second finger must not move it.
  if (drag || e.isPrimary === false || e.button !== 0) return;
  const g = e.target.closest("[data-object]");
  const o = g && objects.find((object) => object.id === Number(g.dataset.object));
  const p = o && point(e);
  if (o && !p) return;
  selected = o?.id ?? null;
  $("canvas").focus({ preventScroll: true });
  if (o) {
    e.preventDefault();
    drag = { o, pointerId: e.pointerId, x: p.x - o.x, y: p.y - o.y };
    $("canvas").setPointerCapture(e.pointerId);
  }
  render();
};
$("canvas").onpointermove = (e) => {
  if (!drag || e.pointerId !== drag.pointerId) return;
  if (!objects.includes(drag.o)) {
    finishDrag(e);
    return;
  }
  const p = point(e);
  if (p) moveObject(drag.o, p.x - drag.x, p.y - drag.y);
};
for (const ev of ["pointerup", "pointercancel", "lostpointercapture"])
  $("canvas").addEventListener(ev, finishDrag);
$("canvas").onkeydown = (e) => {
  // Scope keyboard movement to the focused canvas, never form fields.
  if (e.target !== $("canvas") || e.altKey || e.ctrlKey || e.metaKey || drag) return;
  const movement = { ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
  const o = selectedObject();
  if (!movement || !o) return;
  e.preventDefault();
  const step = e.shiftKey ? 10 : 1;
  moveObject(o, o.x + movement[0] * step, o.y + movement[1] * step);
};
function download(text, type, name) {
  const url = URL.createObjectURL(new Blob([text], { type })),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportComposition() {
  const svg = $("canvas").cloneNode(true);
  svg.removeAttribute("id");
  svg.removeAttribute("aria-label");
  svg.removeAttribute("aria-describedby");
  svg.removeAttribute("tabindex");
  svg.removeAttribute("role");
  svg.removeAttribute("style");
  svg.setAttribute("width", w);
  svg.setAttribute("height", h);
  svg.querySelectorAll("[data-selection]").forEach((n) => n.remove());
  svg.prepend(el("rect", { width: w, height: h, fill: $("background").value }));
  download(
    new XMLSerializer().serializeToString(svg),
    "image/svg+xml",
    "composition.svg",
  );
}
$("export").onclick = exportComposition;

function saveProject() {
  if (objects.some((o) => o.asset.startsWith("custom-"))) {
    $("notice").textContent =
      "Сохранение проекта доступно для встроенной библиотеки. Свою композицию можно скачать в SVG.";
    return;
  }
  download(
    JSON.stringify(
      {
        version: 1,
        w,
        h,
        objects,
        scheme: $("scheme").value,
        palette: customPalette,
        background: $("background").value,
      },
      null,
      2,
    ),
    "application/json",
    "composition-project.json",
  );
}
$("save").onclick = saveProject;

function validateProject(p, fileSize) {
  if (fileSize > MAX_PROJECT_BYTES) throw Error("Файл проекта слишком большой");
  if (
    !p ||
    typeof p !== "object" ||
    Array.isArray(p) ||
    p.version !== 1 ||
    !Array.isArray(p.objects) ||
    p.objects.length > MAX_OBJECTS ||
    ![
      [800, 600],
      [1200, 800],
      [600, 600],
    ].some(([width, height]) => p.w === width && p.h === height)
  )
    throw Error("Неподдерживаемый проект");
  if (p.palette) validatePalette(p.palette);
  for (const o of p.objects)
    if (
      !o ||
      typeof o !== "object" ||
      Array.isArray(o) ||
      Math.abs(o.x) > MAX_COORDINATE ||
      Math.abs(o.y) > MAX_COORDINATE ||
      Math.abs(o.rotation) > 360 ||
      !library.some((a) => a.id === o.asset) ||
      !["main", "background"].includes(o.role) ||
      ![o.x, o.y, o.rotation, o.scale].every(Number.isFinite) ||
      o.scale < 0.2 ||
      o.scale > 3
    )
      throw Error("Некорректный объект");
  if (
    !Object.hasOwn(palettes, p.scheme) ||
    typeof p.background !== "string" ||
    !/^#[\da-f]{6}$/i.test(p.background)
  )
    throw Error("Некорректная палитра");
  const projectPalette = p.palette || palettes[p.scheme];
  if (
    [projectPalette.primary, projectPalette.secondary, projectPalette.ink].some(
      (color) => color.toLowerCase() === p.background.toLowerCase(),
    )
  )
    throw Error("Этот цвет уже используется в элементах. Выберите другой фон.");
}

async function openProject(e) {
  const file = e.target.files[0];
  e.target.value = "";
  const token = ++projectReadToken;
  paletteReadToken += 1;
  if (!file) return;
  try {
    if (file.size > MAX_PROJECT_BYTES) throw Error("Файл проекта слишком большой");
    const p = JSON.parse(await file.text());
    if (token !== projectReadToken) return;
    validateProject(p, file.size);
    w = p.w;
    h = p.h;
    objects = p.objects.map((o) => ({ ...o, id: ++uid }));
    customPalette = p.palette;
    $("scheme").value = p.scheme;
    $("size").value = `${w} × ${h}`;
    $("background").value = p.background;
    selected = null;
    renderLibrary();
    render();
    $("notice").textContent = "Картинка открыта.";
  } catch (err) {
    if (token === projectReadToken) $("notice").textContent = err.message;
  }
}
$("project").onchange = openProject;

async function importArtworkFiles(e) {
  const files = [...e.target.files];
  e.target.value = "";
  const errors = [];
  let imported = 0;
  for (const file of files) {
    try {
      if (file.size > 2000000) throw Error("SVG больше 2 МБ");
      const svg = cleanSVG(await file.text()),
        id = `custom-${++uid}`,
        key = `custom/${id}`;
      cache.set(key, svg);
      library.push({
        id,
        name: file.name.replace(/\.svg$/i, ""),
        tags: [],
        variants: {
          S: { main: key, background: key },
          L: { main: key, background: key },
        },
      });
      imported += 1;
    } catch (err) {
      errors.push(file.name + ": " + err.message);
    }
  }
  renderLibrary();
  if (errors.length) {
    $("notice").textContent =
      `Импортировано: ${imported}. ${errors.join("; ")}`;
  } else if (imported) {
    $("notice").textContent = "Элементы добавлены в библиотеку.";
  }
}
$("files").onchange = importArtworkFiles;

async function init() {
  try {
    library = await (await fetch("assets/library.json", { cache: "no-cache" })).json();
    const paths = [
      ...new Set(
        library.flatMap((a) =>
          Object.values(a.variants).flatMap((v) => Object.values(v)),
        ),
      ),
    ];
    await Promise.all(
      paths.map(async (path) =>
        cache.set(path, cleanSVG(await (await fetch(path, { cache: "no-cache" })).text())),
      ),
    );
    $("background").value = palette().backgroundLight;
    editorReady = true;
    setEditorLoading(false);
    renderLibrary();
    render();
    $("prompt").value = "Рост знаний и новые идеи";
    $("compose").click();
    selected = null;
    render();
    $("notice").textContent =
      "Можно изменить описание или выбрать другой пример.";
  } catch (err) {
    editorReady = false;
    setEditorLoading(true);
    $("notice").textContent = "Не удалось загрузить библиотеку: " + err.message;
  }
}
init();

document.querySelectorAll("[data-example]").forEach((button) =>
  button.addEventListener("click", () => {
    $("prompt").value = button.dataset.example;
    $("compose").click();
  }),
);
