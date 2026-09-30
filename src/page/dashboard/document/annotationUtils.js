// Geometry + drawing helpers shared by the PDF annotator and the PDF export.
//
// Every annotation stores positions as fractions of its page (x → page width, y → page height),
// and sizes as fractions of the page width, so it stays in place at any zoom level.
//   text : { id, type: "text", page, x, y, w, text, color, size }
//   draw : { id, type: "draw", page, strokes: [[[x, y], ...], ...], color, width }

export const BASE_PAGE_WIDTH = 595; // A4 width in pt: font sizes / pen widths are entered relative to it
export const TEXT_LINE_HEIGHT = 1.35;
export const TEXT_PAD_X = 0.3; // em
export const TEXT_PAD_Y = 0.15; // em

let counter = 0;
export const newId = () => `a${Date.now().toString(36)}${(++counter).toString(36)}`;

export const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

// bounding box of all strokes of a drawing
export function drawBounds(ann) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  ann.strokes.forEach((stroke) =>
    stroke.forEach(([x, y]) => {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }),
  );
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0, w: 0, h: 0 };
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

// top-left corner of an annotation
export function originOf(ann) {
  if (ann.type === "text") return { x: ann.x, y: ann.y };
  const b = drawBounds(ann);
  return { x: b.minX, y: b.minY };
}

// move an annotation so its top-left corner is at (x, y) on `page`
export function moveTo(ann, page, x, y) {
  if (ann.type === "text") {
    return { ...ann, page, x: clamp(x, 0, Math.max(0, 1 - ann.w)), y: clamp(y, 0, 0.98) };
  }
  const b = drawBounds(ann);
  const nx = clamp(x, 0, Math.max(0, 1 - b.w));
  const ny = clamp(y, 0, Math.max(0, 1 - b.h));
  const dx = nx - b.minX;
  const dy = ny - b.minY;
  return {
    ...ann,
    page,
    strokes: ann.strokes.map((s) => s.map(([px, py]) => [px + dx, py + dy])),
  };
}

// scale a drawing around (ox, oy) — used by the resize handle
export function scaleDraw(ann, factor, ox, oy) {
  return {
    ...ann,
    width: ann.width * factor,
    strokes: ann.strokes.map((s) => s.map(([px, py]) => [ox + (px - ox) * factor, oy + (py - oy) * factor])),
  };
}

const f = (n) => Number(n.toFixed(5));

// smooth SVG path (quadratic curves through the midpoints of the points)
export function svgPath(points) {
  if (!points.length) return "";
  if (points.length === 1) {
    const [x, y] = points[0];
    return `M${f(x)} ${f(y)}L${f(x)} ${f(y)}`;
  }
  let d = `M${f(points[0][0])} ${f(points[0][1])}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const [nx, ny] = points[i + 1];
    d += `Q${f(x)} ${f(y)} ${f((x + nx) / 2)} ${f((y + ny) / 2)}`;
  }
  const last = points[points.length - 1];
  d += `L${f(last[0])} ${f(last[1])}`;
  return d;
}

// same smoothing on a canvas (coordinates already in pixels)
export function tracePath(ctx, points, W, H) {
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0][0] * W, points[0][1] * H);
  if (points.length === 1) {
    ctx.lineTo(points[0][0] * W, points[0][1] * H);
  } else {
    for (let i = 1; i < points.length - 1; i++) {
      const [x, y] = points[i];
      const [nx, ny] = points[i + 1];
      ctx.quadraticCurveTo(x * W, y * H, ((x + nx) / 2) * W, ((y + ny) / 2) * H);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last[0] * W, last[1] * H);
  }
  ctx.stroke();
}

// split text into lines that fit `maxWidth` (Khmer has no spaces → break on word segments)
export function wrapText(ctx, text, maxWidth) {
  const segmenter =
    typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter("km", { granularity: "word" }) : null;
  const tokens = (line) =>
    segmenter ? Array.from(segmenter.segment(line), (s) => s.segment) : Array.from(line);

  const lines = [];
  String(text)
    .split("\n")
    .forEach((paragraph) => {
      let current = "";
      tokens(paragraph).forEach((token) => {
        const test = current + token;
        if (ctx.measureText(test).width <= maxWidth || current === "") {
          current = test;
          return;
        }
        lines.push(current.trimEnd());
        current = token.trimStart();
      });
      lines.push(current);
    });

  // a single word wider than the box → break it by characters
  return lines.flatMap((line) => {
    if (ctx.measureText(line).width <= maxWidth) return [line];
    const parts = [];
    let cur = "";
    Array.from(line).forEach((ch) => {
      if (ctx.measureText(cur + ch).width > maxWidth && cur) {
        parts.push(cur);
        cur = ch;
      } else cur += ch;
    });
    parts.push(cur);
    return parts;
  });
}

// draw the annotations of ONE page on a canvas of W × H pixels
export function paintAnnotations(ctx, W, H, list, fontFamily) {
  list.forEach((ann) => {
    if (ann.type === "draw") {
      ctx.strokeStyle = ann.color;
      ctx.lineWidth = Math.max(1, ann.width * W);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ann.strokes.forEach((s) => tracePath(ctx, s, W, H));
      return;
    }
    if (!ann.text || !ann.text.trim()) return;
    const px = ann.size * W;
    ctx.font = `${px}px ${fontFamily}`;
    ctx.fillStyle = ann.color;
    ctx.textBaseline = "top";
    const padX = px * TEXT_PAD_X;
    const padY = px * TEXT_PAD_Y;
    const lineHeight = px * TEXT_LINE_HEIGHT;
    const lines = wrapText(ctx, ann.text, ann.w * W - padX * 2);
    lines.forEach((line, i) => {
      ctx.fillText(line, ann.x * W + padX, ann.y * H + padY + i * lineHeight + (lineHeight - px) / 2);
    });
  });
}
