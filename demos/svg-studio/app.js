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
const el = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};
function cleanSVG(text) {
  const d = new DOMParser().parseFromString(text, "image/svg+xml");
  if (d.querySelector("parsererror") || d.documentElement.localName !== "svg")
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
    for (const a of [...n.attributes])
      if (
        /^on/i.test(a.name) ||
        a.name === "style" ||
        a.name === "xml:base" ||
        (/href$/.test(a.name) && !a.value.startsWith("#")) ||
        /url\((?!\s*['"]?#)/i.test(a.value)
      )
        n.removeAttribute(a.name);
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
  "#181817": "ink",
  white: "paper",
  "#ffffff": "paper",
  "#fff": "paper",
};
function cloneArtwork(asset, role, prefix) {
  const root = artwork(asset, role).cloneNode(true),
    ids = new Map(),
    p = palette();
  root.querySelectorAll("[id]").forEach((n) => ids.set(n.id, prefix + n.id));
  for (const n of [root, ...root.querySelectorAll("*")])
    for (const a of [...n.attributes]) {
      let v = a.value;
      if (a.name === "id") v = ids.get(v) || v;
      else {
        for (const [old, id] of ids) {
          v = v.replaceAll(`url(#${old})`, `url(#${id})`);
          if (v === `#${old}`) v = `#${id}`;
        }
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
function render() {
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
  $("count").textContent =
    `Объектов: ${objects.length} · ${w >= 1000 ? "L" : "S"}`;
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
      b.onclick = () => {
        const i = objects.indexOf(o),
          j = i + d;
        if (j >= 0 && j < objects.length) {
          [objects[i], objects[j]] = [objects[j], objects[i]];
          render();
        }
      };
      row.append(b);
    }
    $("layers").append(row);
  });
  const o = objects.find((o) => o.id === selected);
  $("selection").textContent =
    library.find((a) => a.id === o?.asset)?.name || "Ничего не выбрано";
  for (const prop of ["rotation", "scale", "role"]) {
    $(prop).disabled = !o;
    if (o) $(prop).value = o[prop];
  }
}
for (const prop of ["rotation", "scale", "role"])
  $(prop).oninput = (e) => {
    const o = objects.find((o) => o.id === selected);
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
  const o = objects.find((o) => o.id === selected);
  if (o) {
    objects.push({ ...o, id: ++uid, x: o.x + 25, y: o.y + 25 });
    selected = uid;
    render();
  }
};
$("size").onchange = (e) => {
  const oldW = w,
    oldH = h;
  [w, h] = e.target.value.split(" × ").map(Number);
  objects.forEach((o) => {
    o.x = (o.x / oldW) * w;
    o.y = (o.y / oldH) * h;
  });
  render();
};
$("background").oninput = () => {
  const p = palette();
  if (
    [p.primary, p.secondary, p.ink].includes(
      $("background").value.toLowerCase(),
    )
  ) {
    $("notice").textContent =
      "Этот цвет зарезервирован для объектов. Выберите цвет фона из фоновой палитры.";
    $("background").value = p.backgroundLight;
  }
  render();
};
$("scheme").onchange = () => {
  customPalette = null;
  $("background").value = palette().backgroundLight;
  renderLibrary();
  render();
};
$("recolor").onclick = () => {
  renderLibrary();
  render();
};
$("palette").onchange = async (e) => {
  try {
    if (!e.target.files[0]) return;
    const p = JSON.parse(await e.target.files[0].text());
    validatePalette(p);
    customPalette = p;
    $("background").value = p.backgroundLight;
    renderLibrary();
    render();
    $("notice").textContent = "Палитра применена к главным и фоновым объектам.";
  } catch (err) {
    $("notice").textContent = err.message;
  }
};
$("search").oninput = renderLibrary;
$("compose").onclick = () => {
  const result = chooseAssets($("prompt").value, library);
  if (!result.length) {
    $("notice").textContent =
      "Не нашёл подходящих объектов. Попробуйте «рост знаний», «музыкальная пауза» или названия из библиотеки.";
    return;
  }
  objects = [];
  const main = result.slice(0, 3);
  main.forEach((a, i) =>
    add(a, {
      x: (w * (i + 1)) / (main.length + 1),
      y: h * (i % 2 ? 0.46 : 0.57),
      rotation: i % 2 ? 7 : -5,
      scale: main.length === 1 ? 1.5 : 1.05,
    }),
  );
  const backdrop = library.find(
    (a) => a.id === "plant" && !main.some((x) => x.id === a.id),
  );
  if (backdrop) {
    const o = add(backdrop, {
      role: "background",
      x: w * 0.78,
      y: h * 0.32,
      scale: 0.9,
      rotation: 10,
    });
    objects.unshift(objects.pop());
  }
  selected = objects.find((o) => o.role === "main")?.id;
  $("notice").textContent =
    "Подбор по словарю смысловых тегов. Композицию можно отредактировать.";
  render();
};
let drag = null;
function point(e) {
  return new DOMPoint(e.clientX, e.clientY).matrixTransform(
    $("canvas").getScreenCTM().inverse(),
  );
}
$("canvas").onpointerdown = (e) => {
  const g = e.target.closest("[data-object]");
  if (!g) {
    selected = null;
    render();
    return;
  }
  selected = Number(g.dataset.object);
  const o = objects.find((o) => o.id === selected),
    p = point(e);
  drag = { o, x: p.x - o.x, y: p.y - o.y };
  $("canvas").setPointerCapture(e.pointerId);
  render();
};
$("canvas").onpointermove = (e) => {
  if (drag) {
    const p = point(e);
    drag.o.x = p.x - drag.x;
    drag.o.y = p.y - drag.y;
    render();
  }
};
for (const ev of ["pointerup", "pointercancel", "lostpointercapture"])
  $("canvas").addEventListener(ev, () => (drag = null));
function download(text, type, name) {
  const url = URL.createObjectURL(new Blob([text], { type })),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$("export").onclick = () => {
  const svg = $("canvas").cloneNode(true);
  svg.removeAttribute("id");
  svg.removeAttribute("aria-label");
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
};
$("save").onclick = () => {
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
};
$("project").onchange = async (e) => {
  try {
    const p = JSON.parse(await e.target.files[0].text());
    if (e.target.files[0].size > 1000000)
      throw Error("Файл проекта слишком большой");
    if (
      p.version !== 1 ||
      !Array.isArray(p.objects) ||
      p.objects.length > 100 ||
      ![600, 800, 1200].includes(p.w) ||
      ![600, 800].includes(p.h)
    )
      throw Error("Неподдерживаемый проект");
    if (p.palette) validatePalette(p.palette);
    for (const o of p.objects)
      if (
        Math.abs(o.x) > 5000 ||
        Math.abs(o.y) > 5000 ||
        Math.abs(o.rotation) > 360 ||
        !library.some((a) => a.id === o.asset) ||
        !["main", "background"].includes(o.role) ||
        ![o.x, o.y, o.rotation, o.scale].every(Number.isFinite) ||
        o.scale < 0.2 ||
        o.scale > 3
      )
        throw Error("Некорректный объект");
    if (!palettes[p.scheme] || !/^#[\da-f]{6}$/i.test(p.background))
      throw Error("Некорректная палитра");
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
  } catch (err) {
    $("notice").textContent = err.message;
  }
};
$("files").onchange = async (e) => {
  for (const file of e.target.files) {
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
    } catch (err) {
      $("notice").textContent = file.name + ": " + err.message;
    }
  }
  renderLibrary();
  $("notice").textContent =
    "SVG импортированы. Для своих элементов цветовые роли зависят от исходной палитры.";
};
async function init() {
  try {
    library = await (await fetch("assets/library.json")).json();
    const paths = [
      ...new Set(
        library.flatMap((a) =>
          Object.values(a.variants).flatMap((v) => Object.values(v)),
        ),
      ),
    ];
    await Promise.all(
      paths.map(async (path) =>
        cache.set(path, cleanSVG(await (await fetch(path)).text())),
      ),
    );
    $("background").value = palette().backgroundLight;
    renderLibrary();
    render();
    $("notice").textContent =
      "10 объектов · варианты S/L · главные и фоновые. Исходники из Figma.";
  } catch (err) {
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
