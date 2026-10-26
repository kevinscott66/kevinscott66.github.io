/* Слойра — © 2026 Павлович Александр Кириллович / dobropalm. Code: MIT. Artwork: ASSET-NOTICE.md. */
// Imported artwork supports passive vector elements only.
const SVG_ALLOWED_ELEMENTS = new Set(
  "svg g defs path rect circle ellipse polygon polyline line text tspan use symbol title desc linearGradient radialGradient stop clipPath mask pattern filter feGaussianBlur feOffset feBlend feColorMatrix feComposite feFlood feMerge feMergeNode feComponentTransfer feFuncR feFuncG feFuncB feFuncA".split(
    " ",
  ),
);

// Attribute boundary shared by imported artwork and the bundled library.
// Return a normalized safe value, or null to remove the attribute.
const SVG_SAFE_ATTRIBUTES = new Set(
  "id viewBox width height x y x1 x2 y1 y2 cx cy r rx ry d points transform preserveAspectRatio opacity fill-rule clip-rule stroke-width stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset fill-opacity stroke-opacity vector-effect color font-family font-size font-weight text-anchor dominant-baseline dx dy textLength lengthAdjust gradientUnits gradientTransform spreadMethod fx fy fr offset stop-color stop-opacity clipPathUnits maskUnits maskContentUnits patternUnits patternContentUnits patternTransform patternContentUnits filterUnits primitiveUnits result in in2 stdDeviation mode type values operator k1 k2 k3 k4 flood-color flood-opacity slope intercept amplitude exponent tableValues".split(
    " ",
  ),
);
const SVG_PAINT_ATTRIBUTES = new Set(["fill", "stroke"]);
const SVG_REFERENCE_ATTRIBUTES = new Set([
  "clip-path",
  "mask",
  "filter",
  "marker-start",
  "marker-mid",
  "marker-end",
]);
function svgFragment(value) {
  return /^#[^\s"'<>()[\]{}\\]+$/.test(value);
}
function svgLocalUrl(value) {
  const match = /^url\(\s*(['"]?)(#[^\s"'<>()[\]{}\\]+)\1\s*\)$/i.exec(value);
  return match ? `url(${match[2]})` : null;
}
function svgSafeColor(value) {
  return /^(?:none|transparent|currentColor|context-fill|context-stroke|[a-z]+|#[\da-f]{3,4}|#[\da-f]{6}|#[\da-f]{8}|(?:rgb|rgba|hsl|hsla)\([\d\s.,%+/-]+\))$/i.test(
    value,
  );
}
function safeSvgAttribute(name, rawValue) {
  const value = rawValue.trim();
  if (name === "href" || name === "xlink:href")
    return svgFragment(value) ? value : null;
  if (SVG_PAINT_ATTRIBUTES.has(name)) {
    const paint = /^url\(\s*(['"]?)(#[^\s"'<>()[\]{}\\]+)\1\s*\)\s*(.*)$/i.exec(
      value,
    );
    if (paint) {
      const fallback = paint[3].trim();
      return !fallback || svgSafeColor(fallback)
        ? `url(${paint[2]})${fallback ? ` ${fallback}` : ""}`
        : null;
    }
    return svgSafeColor(value) ? value : null;
  }
  if (SVG_REFERENCE_ATTRIBUTES.has(name))
    return value === "none" ? value : svgLocalUrl(value);
  if (!SVG_SAFE_ATTRIBUTES.has(name)) return null;
  if (name === "id") return rawValue; // IDs are remapped to ASCII at cloning time.
  // No attribute in the supported grammar needs CSS escapes or comments.
  if (
    /[\\\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value) ||
    /\/\*|url\s*\(/i.test(value)
  )
    return null;
  if (name === "stop-color" || name === "flood-color" || name === "color")
    return svgSafeColor(value) ? value : null;
  return value;
}
