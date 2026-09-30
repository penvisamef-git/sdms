import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  GripHorizontal,
  LoaderCircle,
  MousePointer2,
  PenLine,
  Pencil,
  Save,
  Trash2,
  Type,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { loadPdfJs } from "./pdfLibs";
import { exportSignedPdf } from "./pdfExport";
import SignaturePad from "./SignaturePad";
import {
  BASE_PAGE_WIDTH,
  TEXT_LINE_HEIGHT,
  TEXT_PAD_X,
  TEXT_PAD_Y,
  clamp,
  drawBounds,
  moveTo,
  newId,
  originOf,
  scaleDraw,
  svgPath,
} from "./annotationUtils";
import "./pdfAnnotator.style.css";

const COLORS = ["#111111", "#1a56db", "#d61f1f", "#0e8a3a", "#7c3aed", "#e08a00"];
const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 40];
const PEN_WIDTHS = [1, 2, 3, 5, 8];
const DEFAULT_TEXT_W = 0.35;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.5;
const HISTORY_MAX = 50;

const isBlankText = (a) => a.type === "text" && !a.text.trim();

// keep the same array for a page when none of its annotations changed (so memoised pages skip rendering)
function groupByPage(list, previous) {
  const groups = new Map();
  list.forEach((a) => {
    if (!groups.has(a.page)) groups.set(a.page, []);
    groups.get(a.page).push(a);
  });
  groups.forEach((items, page) => {
    const old = previous.get(page);
    if (old && old.length === items.length && old.every((a, i) => a === items[i])) groups.set(page, old);
  });
  return groups;
}

/* ------------------------------------------------------------------ one text box */

function TextBox({ ann, width, selected, autoFocus, api }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [ann.text, ann.w, ann.size, width]);

  useEffect(() => {
    if (!autoFocus || !ref.current) return;
    ref.current.focus();
    api.focused();
  }, [autoFocus, api]);

  const fontPx = ann.size * width;

  return (
    <div
      className={`pdfa-text pdfa-item ${selected ? "is-selected" : ""}`}
      data-ann={ann.id}
      style={{ left: `${ann.x * 100}%`, top: `${ann.y * 100}%`, width: `${ann.w * 100}%` }}
      onPointerDown={() => api.select(ann.id)}
    >
      <div className="pdfa-text-bar">
        <span className="pdfa-grip" title="អូសដើម្បីផ្លាស់ទី" onPointerDown={(e) => api.dragStart(e, ann)}>
          <GripHorizontal size={14} />
        </span>
        <button type="button" className="pdfa-mini" title="លុប" onClick={() => api.remove(ann.id)}>
          <Trash2 size={12} />
        </button>
      </div>
      <textarea
        ref={ref}
        className="pdfa-textarea"
        value={ann.text}
        rows={1}
        spellCheck={false}
        placeholder="វាយអក្សរ…"
        style={{
          fontSize: `${fontPx}px`,
          color: ann.color,
          lineHeight: TEXT_LINE_HEIGHT,
          padding: `${TEXT_PAD_Y}em ${TEXT_PAD_X}em`,
        }}
        onFocus={() => api.textFocus(ann.id)}
        onBlur={() => api.textBlur(ann.id)}
        onChange={(e) => api.setText(ann.id, e.target.value)}
      />
      <span className="pdfa-resize pdfa-resize-e" title="ប្តូរទទឹង" onPointerDown={(e) => api.resizeStart(e, ann)} />
    </div>
  );
}

/* ------------------------------------------------------------------ one page */

const PdfPage = memo(function PdfPage({
  pdf,
  n,
  meta,
  width,
  scrollRef,
  annotations,
  live,
  selectedId,
  focusId,
  tool,
  api,
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const height = (width * meta.h) / meta.w;

  useEffect(() => {
    api.registerPage(n, wrapRef.current);
    return () => api.registerPage(n, null);
  }, [n, api]);

  // only pages near the viewport are rendered
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      root: scrollRef.current,
      rootMargin: "1200px 0px",
    });
    observer.observe(wrapRef.current);
    return () => observer.disconnect();
  }, [scrollRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!visible) {
      canvas.width = 0;
      canvas.height = 0;
      return undefined;
    }
    let cancelled = false;
    let task = null;
    (async () => {
      const page = await pdf.getPage(n);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = page.getViewport({ scale: (width / meta.w) * dpr });
      const off = document.createElement("canvas");
      off.width = Math.ceil(viewport.width);
      off.height = Math.ceil(viewport.height);
      task = page.render({ canvasContext: off.getContext("2d"), canvas: off, viewport });
      await task.promise;
      if (cancelled) return;
      canvas.width = off.width;
      canvas.height = off.height;
      canvas.getContext("2d").drawImage(off, 0, 0);
    })().catch((err) => {
      if (err && err.name === "RenderingCancelledException") return;
      // a failed page stays blank
    });
    return () => {
      cancelled = true;
      if (task) task.cancel();
    };
  }, [visible, width, pdf, n, meta.w]);

  const draws = annotations.filter((a) => a.type === "draw");
  const texts = annotations.filter((a) => a.type === "text");
  const selectedDraw = draws.find((a) => a.id === selectedId);

  return (
    <div ref={wrapRef} className="pdfa-page" data-page={n} style={{ width, height }}>
      <canvas ref={canvasRef} className="pdfa-canvas" />

      <div
        className={`pdfa-overlay pdfa-overlay-${tool}`}
        onPointerDown={(e) => api.overlayDown(e, n)}
        onPointerMove={api.overlayMove}
        onPointerUp={api.overlayUp}
        onPointerCancel={api.overlayUp}
      >
        <svg className="pdfa-svg" viewBox="0 0 1 1" preserveAspectRatio="none">
          {draws.map((a) => (
            <g key={a.id}>
              {a.strokes.map((s, i) => (
                <path
                  key={i}
                  d={svgPath(s)}
                  fill="none"
                  stroke={a.color}
                  strokeWidth={Math.max(1, a.width * width)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {tool === "select" &&
                a.strokes.map((s, i) => (
                  <path
                    key={`hit${i}`}
                    className="pdfa-hit pdfa-item"
                    data-ann={a.id}
                    d={svgPath(s)}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={Math.max(14, a.width * width + 8)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    onPointerDown={(e) => {
                      api.select(a.id);
                      api.dragStart(e, a);
                    }}
                  />
                ))}
            </g>
          ))}
          {live && (
            <path
              d={svgPath(live.points)}
              fill="none"
              stroke={live.color}
              strokeWidth={Math.max(1, live.width * width)}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {selectedDraw && tool === "select" && <DrawSelection ann={selectedDraw} api={api} />}

        {texts.map((a) => (
          <TextBox
            key={a.id}
            ann={a}
            width={width}
            selected={a.id === selectedId}
            autoFocus={a.id === focusId}
            api={api}
          />
        ))}
      </div>
    </div>
  );
});

// dashed frame + delete + resize handle around the selected drawing / signature
function DrawSelection({ ann, api }) {
  const b = drawBounds(ann);
  const w = Math.max(b.w, 0.01);
  const h = Math.max(b.h, 0.01);
  return (
    <div
      className="pdfa-selbox pdfa-item"
      data-ann={ann.id}
      style={{ left: `${b.minX * 100}%`, top: `${b.minY * 100}%`, width: `${w * 100}%`, height: `${h * 100}%` }}
      onPointerDown={(e) => api.dragStart(e, ann)}
    >
      <button
        type="button"
        className="pdfa-mini pdfa-selbox-del"
        title="លុប"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => api.remove(ann.id)}
      >
        <Trash2 size={12} />
      </button>
      <span className="pdfa-resize pdfa-resize-se" title="ប្តូរទំហំ" onPointerDown={(e) => api.resizeStart(e, ann)} />
    </div>
  );
}

/* ------------------------------------------------------------------ the annotator */

/**
 * PDF viewer with a small "notepad" on top:
 *   text boxes · pen (colours / widths) · signature — every item can be dragged to any page.
 *   The result is downloaded as a new PDF (the original file is never changed).
 *
 * props: file ({ url, original_name }) · onError(err) · onPlain() → switch to the browser's own viewer
 *        onSave(blob) → async, replaces the saved file with the signed PDF (button hidden when not given)
 *        saveBlockedReason → text: the save button is disabled and this explains why
 *        notice → green message under the toolbar (e.g. "saved")
 */
function PdfAnnotator({ file, onError, onPlain, onSave, saveBlockedReason, notice }) {
  const [doc, setDoc] = useState(null); // { pdf, pages: [{w, h}] }
  const [tool, setTool] = useState("select");
  const [color, setColor] = useState(COLORS[1]);
  const [size, setSize] = useState(16 / BASE_PAGE_WIDTH);
  const [penW, setPenW] = useState(2 / BASE_PAGE_WIDTH);
  const [annotations, setAnnotations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [focusId, setFocusId] = useState(null);
  const [live, setLive] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [containerW, setContainerW] = useState(800);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPad, setShowPad] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [exportError, setExportError] = useState("");

  const scrollRef = useRef(null);
  const pageEls = useRef({});
  const annRef = useRef(annotations);
  const histRef = useRef([]);
  const dragRef = useRef(null);
  const liveRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const focusSnapRef = useRef(null);
  const groupsRef = useRef(new Map());
  const prevSelected = useRef(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const S = useRef({});
  S.current = { tool, color, size, penW, selectedId };
  annRef.current = annotations;

  /* ---------- load the PDF ---------- */
  useEffect(() => {
    let cancelled = false;
    let task = null;
    (async () => {
      const pdfjs = await loadPdfJs();
      task = pdfjs.getDocument({ url: file.url });
      const pdf = await task.promise;
      const pages = await Promise.all(
        Array.from({ length: pdf.numPages }, async (_, i) => {
          const page = await pdf.getPage(i + 1);
          const viewport = page.getViewport({ scale: 1 });
          return { w: viewport.width, h: viewport.height };
        }),
      );
      if (!cancelled) setDoc({ pdf, pages });
    })().catch((err) => {
      if (!cancelled && onErrorRef.current) onErrorRef.current(err);
    });
    return () => {
      cancelled = true;
      if (task) task.destroy();
    };
  }, [file.url]);

  /* ---------- container width ---------- */
  useEffect(() => {
    const el = scrollRef.current;
    const update = () => setContainerW(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const pageWidth = Math.max(240, (containerW - 32) * zoom);

  /* ---------- history ---------- */
  const pushHistory = useCallback(() => {
    histRef.current.push(annRef.current);
    if (histRef.current.length > HISTORY_MAX) histRef.current.shift();
  }, []);

  const commit = useCallback(
    (fn) => {
      pushHistory();
      setAnnotations((list) => fn(list));
    },
    [pushHistory],
  );

  const undo = useCallback(() => {
    const prev = histRef.current.pop();
    if (!prev) return;
    setAnnotations(prev);
    setSelectedId((id) => (id && prev.some((a) => a.id === id) ? id : null));
  }, []);

  // an empty text box disappears as soon as it is no longer selected
  useEffect(() => {
    const before = prevSelected.current;
    prevSelected.current = selectedId;
    if (before && before !== selectedId) {
      setAnnotations((list) => (list.some((a) => a.id === before && isBlankText(a)) ? list.filter((a) => a.id !== before) : list));
    }
  }, [selectedId]);

  /* ---------- page helpers ---------- */
  const pageAt = useCallback((x, y) => {
    let best = null;
    let bestDist = Infinity;
    Object.entries(pageEls.current).forEach(([n, el]) => {
      const rect = el.getBoundingClientRect();
      const dist = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0;
      if (dist < bestDist) {
        bestDist = dist;
        best = { n: Number(n), rect };
      }
    });
    return best;
  }, []);

  // the page that is most visible in the scroll area
  const visiblePage = useCallback(() => {
    const sc = scrollRef.current;
    if (!sc) return null;
    const box = sc.getBoundingClientRect();
    let best = null;
    let bestOverlap = -1;
    Object.entries(pageEls.current).forEach(([n, el]) => {
      const rect = el.getBoundingClientRect();
      const top = Math.max(rect.top, box.top);
      const bottom = Math.min(rect.bottom, box.bottom);
      const overlap = bottom - top;
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        best = { n: Number(n), rect, top, bottom };
      }
    });
    return best;
  }, []);

  const onScroll = useCallback(() => {
    const vp = visiblePage();
    if (vp) setCurrentPage(vp.n);
  }, [visiblePage]);

  /* ---------- annotation actions ---------- */
  const select = useCallback((id) => {
    setSelectedId(id);
    const ann = annRef.current.find((a) => a.id === id);
    if (ann) {
      setColor(ann.color);
      if (ann.type === "text") setSize(ann.size);
    }
  }, []);

  const remove = useCallback(
    (id) => {
      commit((list) => list.filter((a) => a.id !== id));
      setSelectedId((cur) => (cur === id ? null : cur));
    },
    [commit],
  );

  const setText = useCallback((id, text) => {
    setAnnotations((list) => list.map((a) => (a.id === id ? { ...a, text } : a)));
  }, []);

  const addText = useCallback(
    (page, fx, fy) => {
      const { color: c, size: s } = S.current;
      const ann = {
        id: newId(),
        type: "text",
        page,
        x: clamp(fx, 0, 1 - DEFAULT_TEXT_W),
        y: clamp(fy, 0, 0.95),
        w: DEFAULT_TEXT_W,
        text: "",
        color: c,
        size: s,
      };
      commit((list) => [...list, ann]);
      setSelectedId(ann.id);
      setFocusId(ann.id);
      setTool("select");
    },
    [commit],
  );

  const addSignature = useCallback(
    (sig) => {
      const vp = visiblePage();
      const page = vp ? vp.n : 1;
      const meta = doc.pages[page - 1];
      let fw = 0.28;
      const ratioPage = meta.w / meta.h; // page width / page height
      // keep it inside the page if it is tall
      if (sig.ratio * fw * ratioPage > 0.5) fw = 0.5 / (sig.ratio * ratioPage);
      const fh = sig.ratio * fw * ratioPage;
      const cy = vp ? clamp(((vp.top + vp.bottom) / 2 - vp.rect.top) / vp.rect.height, 0.05, 0.95) : 0.5;
      const x0 = 0.5 - fw / 2;
      const y0 = cy - fh / 2;
      const ann = moveTo(
        {
          id: newId(),
          type: "draw",
          page,
          color: sig.color,
          width: sig.width * fw,
          strokes: sig.strokes.map((s) => s.map(([x, y]) => [x * fw, y * fw * ratioPage])),
        },
        page,
        x0,
        y0,
      );
      commit((list) => [...list, ann]);
      setSelectedId(ann.id);
      setTool("select");
      setShowPad(false);
    },
    [commit, doc, visiblePage],
  );

  // colour / size changes also apply to the selected item
  const changeColor = (c) => {
    setColor(c);
    const sel = annRef.current.find((a) => a.id === selectedId);
    if (sel) commit((list) => list.map((a) => (a.id === sel.id ? { ...a, color: c } : a)));
  };
  const changeSize = (px) => {
    const v = px / BASE_PAGE_WIDTH;
    setSize(v);
    const sel = annRef.current.find((a) => a.id === selectedId);
    if (sel && sel.type === "text") commit((list) => list.map((a) => (a.id === sel.id ? { ...a, size: v } : a)));
  };
  const changePen = (px) => setPenW(px / BASE_PAGE_WIDTH);

  const chooseTool = (t) => {
    setTool(t);
    if (t !== "select") setSelectedId(null);
  };

  /* ---------- text focus / undo of typing ---------- */
  const textFocus = useCallback((id) => {
    focusSnapRef.current = annRef.current;
    setSelectedId(id);
  }, []);
  const textBlur = useCallback(
    (id) => {
      const snap = focusSnapRef.current;
      focusSnapRef.current = null;
      if (!snap) return;
      const before = snap.find((a) => a.id === id);
      const after = annRef.current.find((a) => a.id === id);
      if (before && after && before.text !== after.text) {
        histRef.current.push(snap);
        if (histRef.current.length > HISTORY_MAX) histRef.current.shift();
      }
    },
    [],
  );

  /* ---------- pen (drawing on the overlay) ---------- */
  const overlayDown = useCallback(
    (e, page) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const { tool: t, color: c, penW: w } = S.current;
      if (t !== "text" && t !== "pen") return;
      const rect = e.currentTarget.getBoundingClientRect();
      const fx = (e.clientX - rect.left) / rect.width;
      const fy = (e.clientY - rect.top) / rect.height;
      e.preventDefault();
      if (t === "text") {
        addText(page, fx, fy);
        return;
      }
      e.currentTarget.setPointerCapture(e.pointerId);
      liveRef.current = { page, rect, points: [[clamp(fx, 0, 1), clamp(fy, 0, 1)]], color: c, width: w };
      setLive({ ...liveRef.current });
    },
    [addText],
  );

  const overlayMove = useCallback((e) => {
    const l = liveRef.current;
    if (!l) return;
    const events = e.nativeEvent.getCoalescedEvents ? e.nativeEvent.getCoalescedEvents() : [];
    (events.length ? events : [e]).forEach((ev) => {
      const x = clamp((ev.clientX - l.rect.left) / l.rect.width, 0, 1);
      const y = clamp((ev.clientY - l.rect.top) / l.rect.height, 0, 1);
      const last = l.points[l.points.length - 1];
      if (Math.abs(x - last[0]) + Math.abs(y - last[1]) > 0.0007) l.points.push([x, y]);
    });
    setLive({ ...l });
  }, []);

  const overlayUp = useCallback(() => {
    const l = liveRef.current;
    if (!l) return;
    liveRef.current = null;
    setLive(null);
    commit((list) => [
      ...list,
      { id: newId(), type: "draw", page: l.page, strokes: [l.points], color: l.color, width: l.width },
    ]);
  }, [commit]);

  /* ---------- dragging and resizing items (works across pages) ---------- */
  const dragStart = useCallback((e, ann) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const el = pageEls.current[ann.page];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const o = originOf(ann);
    dragRef.current = {
      mode: "move",
      id: ann.id,
      offX: e.clientX - (rect.left + o.x * rect.width),
      offY: e.clientY - (rect.top + o.y * rect.height),
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    };
    pointerRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const resizeStart = useCallback((e, ann) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      mode: "resize",
      id: ann.id,
      base: ann,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    };
    pointerRef.current = { x: e.clientX, y: e.clientY };
    setSelectedId(ann.id);
  }, []);

  useEffect(() => {
    let raf = 0;

    const apply = () => {
      const d = dragRef.current;
      if (!d) return;
      const { x, y } = pointerRef.current;
      if (!d.moved) {
        if (Math.hypot(x - d.startX, y - d.startY) < 3) return;
        d.moved = true;
        histRef.current.push(annRef.current);
        if (histRef.current.length > HISTORY_MAX) histRef.current.shift();
      }

      if (d.mode === "move") {
        const hit = pageAt(x, y);
        if (!hit) return;
        const fx = (x - d.offX - hit.rect.left) / hit.rect.width;
        const fy = (y - d.offY - hit.rect.top) / hit.rect.height;
        setAnnotations((list) => list.map((a) => (a.id === d.id ? moveTo(a, hit.n, fx, fy) : a)));
        return;
      }

      // resize
      const el = pageEls.current[d.base.page];
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (d.base.type === "text") {
        const w = clamp((x - rect.left) / rect.width - d.base.x, 0.06, 1 - d.base.x);
        setAnnotations((list) => list.map((a) => (a.id === d.id ? { ...a, w } : a)));
        return;
      }
      const b = drawBounds(d.base);
      const left = rect.left + b.minX * rect.width;
      const top = rect.top + b.minY * rect.height;
      const useX = b.w * rect.width >= b.h * rect.height;
      let factor = useX ? (x - left) / Math.max(b.w * rect.width, 1) : (y - top) / Math.max(b.h * rect.height, 1);
      const limit = Math.min(b.w > 0 ? (1 - b.minX) / b.w : Infinity, b.h > 0 ? (1 - b.minY) / b.h : Infinity);
      factor = clamp(factor, 0.2, Math.min(limit, 6));
      setAnnotations((list) => list.map((a) => (a.id === d.id ? scaleDraw(d.base, factor, b.minX, b.minY) : a)));
    };

    const tick = () => {
      const d = dragRef.current;
      if (!d) {
        raf = 0;
        return;
      }
      const sc = scrollRef.current;
      if (sc && d.mode === "move" && d.moved) {
        const r = sc.getBoundingClientRect();
        const y = pointerRef.current.y;
        let dy = 0;
        if (y < r.top + 40) dy = -Math.min(28, (r.top + 40 - y) / 2 + 2);
        else if (y > r.bottom - 40) dy = Math.min(28, (y - (r.bottom - 40)) / 2 + 2);
        if (dy) {
          sc.scrollTop += dy;
          apply();
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      if (!dragRef.current) return;
      pointerRef.current = { x: e.clientX, y: e.clientY };
      apply();
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onUp = () => {
      dragRef.current = null;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pageAt]);

  /* ---------- keyboard ---------- */
  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(TEXTAREA|INPUT|SELECT)$/.test(e.target.tagName);
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z" && !typing) {
        e.preventDefault();
        undo();
      } else if ((e.key === "Delete" || e.key === "Backspace") && !typing && S.current.selectedId) {
        e.preventDefault();
        remove(S.current.selectedId);
      } else if (e.key === "Escape" && !showPad) {
        if (typing) e.target.blur();
        setSelectedId(null);
        setTool("select");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, remove, showPad]);

  /* ---------- download ---------- */
  // burn the annotations into a copy of the PDF → Blob
  const buildBlob = () => {
    const list = annRef.current.filter((a) => !isBlankText(a));
    const fontFamily = getComputedStyle(scrollRef.current).fontFamily || "sans-serif";
    return exportSignedPdf({ pdfDoc: doc.pdf, pages: doc.pages, annotations: list, fontFamily });
  };

  const download = async () => {
    if (!doc) return;
    setExporting(true);
    setExportError("");
    try {
      const blob = await buildBlob();
      const base = String(file.original_name || "document").replace(/\.pdf$/i, "");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${base}_signed.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      setExportError(err?.message || "មិនអាចទាញយកបានទេ");
    } finally {
      setExporting(false);
    }
  };

  // save = replace the file on the server with the signed PDF
  const save = async () => {
    if (!doc || !onSave) return;
    setConfirming(false);
    setSaving(true);
    setExportError("");
    try {
      const blob = await buildBlob();
      await onSave(blob);
    } catch (err) {
      setExportError(err?.message || "មិនអាចរក្សាទុកបានទេ");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- api handed to the pages (stable) ---------- */
  const api = useMemo(
    () => ({
      registerPage: (n, el) => {
        if (el) pageEls.current[n] = el;
        else delete pageEls.current[n];
      },
      overlayDown,
      overlayMove,
      overlayUp,
      dragStart,
      resizeStart,
      select,
      remove,
      setText,
      textFocus,
      textBlur,
      focused: () => setFocusId(null),
    }),
    [overlayDown, overlayMove, overlayUp, dragStart, resizeStart, select, remove, setText, textFocus, textBlur],
  );

  const groups = useMemo(() => {
    const next = groupByPage(annotations, groupsRef.current);
    groupsRef.current = next;
    return next;
  }, [annotations]);

  const selected = annotations.find((a) => a.id === selectedId) || null;
  const realCount = annotations.filter((a) => !isBlankText(a)).length;
  const showFont = tool === "text" || (selected && selected.type === "text");
  const hint =
    tool === "text"
      ? "ចុចលើទំព័រ ដើម្បីដាក់ប្រអប់អក្សរ"
      : tool === "pen"
        ? "សង្កត់ហើយអូសលើទំព័រ ដើម្បីគូរ"
        : "អូសប្រអប់អក្សរ ឬហត្ថលេខា ទៅទំព័រណាក៏បាន";
  const emptyList = useMemo(() => [], []);

  return (
    <div className={`pdfa pdfa-mode-${tool}`}>
      <div
        className="pdfa-toolbar"
        onMouseDown={(e) => {
          // keep the caret in the text box when a toolbar button is pressed
          if (!/^(INPUT|SELECT|OPTION)$/.test(e.target.tagName)) e.preventDefault();
        }}
      >
        <div className="pdfa-group">
          <button type="button" className={`pdfa-btn ${tool === "select" ? "is-active" : ""}`} onClick={() => chooseTool("select")} title="ជ្រើសរើស / ផ្លាស់ទី">
            <MousePointer2 size={16} />
            <span>ជ្រើសរើស</span>
          </button>
          <button type="button" className={`pdfa-btn ${tool === "text" ? "is-active" : ""}`} onClick={() => chooseTool("text")} title="ប្រអប់អក្សរ">
            <Type size={16} />
            <span>អក្សរ</span>
          </button>
          <button type="button" className={`pdfa-btn ${tool === "pen" ? "is-active" : ""}`} onClick={() => chooseTool("pen")} title="ប៊ិច">
            <Pencil size={16} />
            <span>ប៊ិច</span>
          </button>
          <button type="button" className="pdfa-btn" onClick={() => setShowPad(true)} title="ហត្ថលេខា" disabled={!doc}>
            <PenLine size={16} />
            <span>ហត្ថលេខា</span>
          </button>
        </div>

        <div className="pdfa-group">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`pdfa-swatch ${color.toLowerCase() === c ? "is-active" : ""}`}
              style={{ background: c }}
              onClick={() => changeColor(c)}
              title={c}
              aria-label={c}
            />
          ))}
          <label className="pdfa-swatch pdfa-swatch-custom" title="ពណ៌ផ្សេង">
            <input type="color" value={color} onChange={(e) => changeColor(e.target.value)} />
          </label>
        </div>

        <div className="pdfa-group">
          {showFont ? (
            <select
              className="pdfa-select"
              value={Math.round(size * BASE_PAGE_WIDTH)}
              onChange={(e) => changeSize(Number(e.target.value))}
              title="ទំហំអក្សរ"
            >
              {FONT_SIZES.map((v) => (
                <option key={v} value={v}>
                  អក្សរ {v}
                </option>
              ))}
            </select>
          ) : (
            <select
              className="pdfa-select"
              value={Math.round(penW * BASE_PAGE_WIDTH)}
              onChange={(e) => changePen(Number(e.target.value))}
              disabled={tool !== "pen"}
              title="ទំហំប៊ិច"
            >
              {PEN_WIDTHS.map((v) => (
                <option key={v} value={v}>
                  ប៊ិច {v}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="pdfa-group">
          <button type="button" className="pdfa-btn pdfa-btn-icon" onClick={undo} title="មិនធ្វើវិញ (Ctrl+Z)">
            <Undo2 size={16} />
          </button>
          <button
            type="button"
            className="pdfa-btn pdfa-btn-icon"
            onClick={() => selectedId && remove(selectedId)}
            disabled={!selectedId}
            title="លុបធាតុដែលបានជ្រើស (Delete)"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="pdfa-group pdfa-group-end">
          <button type="button" className="pdfa-btn pdfa-btn-icon" onClick={() => setZoom((z) => clamp(+(z - 0.25).toFixed(2), ZOOM_MIN, ZOOM_MAX))} title="បង្រួម">
            <ZoomOut size={16} />
          </button>
          <span className="pdfa-zoom">{Math.round(zoom * 100)}%</span>
          <button type="button" className="pdfa-btn pdfa-btn-icon" onClick={() => setZoom((z) => clamp(+(z + 0.25).toFixed(2), ZOOM_MIN, ZOOM_MAX))} title="ពង្រីក">
            <ZoomIn size={16} />
          </button>
          {doc && (
            <span className="pdfa-pageno">
              {currentPage} / {doc.pages.length}
            </span>
          )}
          <button type="button" className="pdfa-btn pdfa-btn-primary" onClick={download} disabled={!doc || exporting || saving || !realCount} title="ទាញយក PDF ដែលមានហត្ថលេខា/កំណត់ចំណាំ">
            {exporting ? <LoaderCircle size={16} className="pdfa-spin" /> : <Download size={16} />}
            <span>ទាញយក</span>
          </button>
          {onSave && (
            <button
              type="button"
              className="pdfa-btn pdfa-btn-primary"
              onClick={() => setConfirming(true)}
              disabled={!doc || saving || exporting || !realCount || !!saveBlockedReason}
              title={
                saveBlockedReason ||
                (realCount ? "ជំនួសឯកសារដើមដោយឯកសារដែលបានចុះហត្ថលេខា" : "សូមបន្ថែមអក្សរ ឬហត្ថលេខាជាមុន")
              }
            >
              {saving ? <LoaderCircle size={16} className="pdfa-spin" /> : <Save size={16} />}
              <span>{saving ? "កំពុងរក្សាទុក…" : "រក្សាទុក"}</span>
            </button>
          )}
          {onPlain && (
            <button type="button" className="pdfa-btn" onClick={onPlain} title="មើលដោយកម្មវិធីរបស់ browser">
              <span>មើលធម្មតា</span>
            </button>
          )}
        </div>
      </div>

      <div className="pdfa-hint">
        <span>{hint}</span>
        {realCount > 0 && !onSave && (
          <span className="pdfa-hint-warn">ការសរសេរ/ហត្ថលេខាមិនទាន់រក្សាទុកក្នុងប្រព័ន្ធទេ — សូមទាញយកជា PDF</span>
        )}
        {realCount > 0 && onSave && !saveBlockedReason && !confirming && (
          <span className="pdfa-hint-warn">មិនទាន់រក្សាទុក — ចុច «រក្សាទុក» ដើម្បីជំនួសឯកសារដើម ឬ «ទាញយក» ជា PDF ថ្មី</span>
        )}
        {onSave && saveBlockedReason && <span className="pdfa-hint-warn">មិនអាចរក្សាទុកបាន៖ {saveBlockedReason}</span>}
        {notice && <span className="pdfa-hint-ok">{notice}</span>}
        {exportError && <span className="pdfa-hint-error">{exportError}</span>}
      </div>

      {confirming && (
        <div className="pdfa-confirm">
          <span>ជំនួសឯកសារដើមដោយឯកសារដែលបានចុះហត្ថលេខា? ឯកសារនេះនឹងត្រូវបានប្តូរសម្រាប់អ្នកទាំងអស់។</span>
          <div className="pdfa-confirm-actions">
            <button type="button" className="pdfa-btn" onClick={() => setConfirming(false)}>
              បោះបង់
            </button>
            <button type="button" className="pdfa-btn pdfa-btn-primary" onClick={save}>
              <Save size={16} />
              <span>បញ្ជាក់ រក្សាទុក</span>
            </button>
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className="pdfa-scroll"
        onScroll={onScroll}
        onPointerDown={(e) => {
          if (S.current.tool === "select" && !e.target.closest("[data-ann]")) setSelectedId(null);
        }}
      >
        {!doc && (
          <div className="pdfa-loading">
            <LoaderCircle size={22} className="pdfa-spin" />
            <span>កំពុងបើកឯកសារ…</span>
          </div>
        )}
        {doc && (
          <div className="pdfa-pages">
            {doc.pages.map((meta, i) => (
              <PdfPage
                key={i + 1}
                pdf={doc.pdf}
                n={i + 1}
                meta={meta}
                width={pageWidth}
                scrollRef={scrollRef}
                annotations={groups.get(i + 1) || emptyList}
                live={live && live.page === i + 1 ? live : null}
                selectedId={selectedId}
                focusId={focusId}
                tool={tool}
                api={api}
              />
            ))}
          </div>
        )}
      </div>

      {showPad && <SignaturePad initialColor={color} onDone={addSignature} onCancel={() => setShowPad(false)} />}
    </div>
  );
}

export default PdfAnnotator;
