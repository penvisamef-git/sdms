import React, { useCallback, useEffect, useRef, useState } from "react";
import { Check, Trash2, X } from "lucide-react";
import { tracePath } from "./annotationUtils";

const PAD_COLORS = ["#111111", "#1a56db", "#d61f1f"];
const PEN_SIZES = [2, 3, 5];

/**
 * Modal to draw a signature with the mouse / finger / stylus.
 *   onDone({ strokes, width, color, ratio })
 *     strokes : [[[x, y], ...]]  in "signature widths" (x from 0 to 1, y from 0 to ratio)
 *     width   : pen width, also in signature widths
 *     ratio   : height / width of the signature
 */
function SignaturePad({ initialColor, onDone, onCancel }) {
  const canvasRef = useRef(null);
  const boxRef = useRef(null);
  const strokesRef = useRef([]); // [[[x, y], ...]] in css pixels
  const currentRef = useRef(null);
  const [color, setColor] = useState(PAD_COLORS.includes(initialColor) ? initialColor : PAD_COLORS[1]);
  const [pen, setPen] = useState(3);
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const colorRef = useRef(color);
  const penRef = useRef(pen);
  colorRef.current = color;
  penRef.current = pen;

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const all = currentRef.current ? [...strokesRef.current, currentRef.current] : strokesRef.current;
    all.forEach((s) => {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.pen;
      tracePath(ctx, s.points, 1, 1);
    });
  }, []);

  // size the canvas to its box
  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(box.clientWidth * dpr);
      canvas.height = Math.round(box.clientHeight * dpr);
      redraw();
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, [redraw]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const point = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  };

  const down = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    currentRef.current = { color: colorRef.current, pen: penRef.current, points: [point(e)] };
    setStarted(true);
    redraw();
  };

  const move = (e) => {
    const cur = currentRef.current;
    if (!cur) return;
    const events = e.nativeEvent.getCoalescedEvents ? e.nativeEvent.getCoalescedEvents() : [];
    (events.length ? events : [e]).forEach((ev) => cur.points.push(point(ev)));
    redraw();
  };

  const up = () => {
    const cur = currentRef.current;
    if (!cur) return;
    strokesRef.current.push(cur);
    currentRef.current = null;
    setCount(strokesRef.current.length);
    redraw();
  };

  const clear = () => {
    strokesRef.current = [];
    currentRef.current = null;
    setCount(0);
    setStarted(false);
    redraw();
  };

  const finish = () => {
    const strokes = strokesRef.current;
    if (!strokes.length) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    strokes.forEach((s) =>
      s.points.forEach(([x, y]) => {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }),
    );
    const bw = Math.max(maxX - minX, 24);
    const bh = Math.max(maxY - minY, 8);
    const penPx = strokes.reduce((sum, s) => sum + s.pen, 0) / strokes.length;
    onDone({
      strokes: strokes.map((s) => s.points.map(([x, y]) => [(x - minX) / bw, (y - minY) / bw])),
      width: penPx / bw,
      color: strokes[strokes.length - 1].color,
      ratio: bh / bw,
    });
  };

  return (
    <div className="pdfa-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="pdfa-modal-card">
        <div className="pdfa-modal-head">
          <strong>ហត្ថលេខា</strong>
          <button type="button" className="md-icon-btn" onClick={onCancel} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="pdfa-pad-tools">
          {PAD_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`pdfa-swatch ${color === c ? "is-active" : ""}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={c}
            />
          ))}
          <span className="pdfa-sep" />
          {PEN_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              className={`pdfa-pensize ${pen === s ? "is-active" : ""}`}
              onClick={() => setPen(s)}
              aria-label={`pen ${s}`}
            >
              <i style={{ height: s + 1 }} />
            </button>
          ))}
        </div>

        <div className="pdfa-pad" ref={boxRef}>
          <canvas
            ref={canvasRef}
            className="pdfa-pad-canvas"
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
          />
          {!started && <span className="pdfa-pad-hint">ចុះហត្ថលេខានៅទីនេះ</span>}
          <span className="pdfa-pad-line" />
        </div>

        <div className="pdfa-modal-foot">
          <button type="button" className="md-btn md-btn-ghost" onClick={clear} disabled={!count}>
            <Trash2 size={16} />
            សម្អាត
          </button>
          <div className="pdfa-modal-foot-right">
            <button type="button" className="md-btn md-btn-ghost" onClick={onCancel}>
              បោះបង់
            </button>
            <button type="button" className="md-btn md-btn-primary" onClick={finish} disabled={!count}>
              <Check size={16} />
              ដាក់ចូលឯកសារ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignaturePad;
