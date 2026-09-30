import React, { useCallback, useEffect, useRef, useState } from "react";
import { dayLabel, formatNumber, niceScale, percent } from "./homeHelpers";

/* ------------------------------------------------------------------ shared: tooltip */

// One floating readout per chart. Positions are relative to the chart wrapper.
function useHoverTip() {
  const wrapRef = useRef(null);
  const [tip, setTip] = useState(null);

  const showAt = useCallback((x, y, content) => setTip({ x, y, ...content }), []);
  // pointer / focus event on a mark → anchor the tip to the mark's top centre
  const showFor = useCallback((el, content) => {
    const wrap = wrapRef.current;
    if (!wrap || !el) return;
    const w = wrap.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setTip({ x: r.left - w.left + r.width / 2, y: r.top - w.top, ...content });
  }, []);
  const hide = useCallback(() => setTip(null), []);
  return { wrapRef, tip, showAt, showFor, hide };
}

function Tip({ tip, width }) {
  if (!tip) return null;
  // keep the readout inside the chart: flip to the left edge when near the right border
  const flip = width && tip.x > width - 150;
  return (
    <div
      className="hm-tip"
      role="status"
      style={{ left: tip.x, top: tip.y, transform: `translate(${flip ? "-100%" : "-50%"}, calc(-100% - 8px))` }}
    >
      <span className="hm-tip-title">{tip.title}</span>
      <span className="hm-tip-row">
        {tip.color && <i className="hm-tip-key" style={{ background: tip.color }} />}
        <b>{tip.value}</b>
        {tip.unit && <span>{tip.unit}</span>}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ card with a table twin */

/**
 * Chart container: title, subtitle and a "chart | table" switch.
 * The table is the accessible twin of the chart — the same numbers without hovering.
 *   table = { columns: [..], rows: [[..], ..] }
 */
export function ChartCard({ title, subtitle, table, className = "", children }) {
  const [view, setView] = useState("chart");
  return (
    <section className={`hm-card ${className}`}>
      <header className="hm-card-head">
        <div className="hm-card-titles">
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {table && (
          <div className="hm-seg" role="group" aria-label="ទិដ្ឋភាព">
            <button type="button" className={view === "chart" ? "is-active" : ""} onClick={() => setView("chart")}>
              ក្រាហ្វិក
            </button>
            <button type="button" className={view === "table" ? "is-active" : ""} onClick={() => setView("table")}>
              តារាង
            </button>
          </div>
        )}
      </header>
      <div className="hm-card-body">
        {view === "table" && table ? (
          <div className="hm-table-scroll">
            <table className="hm-table">
              <thead>
                <tr>
                  {table.columns.map((c, i) => (
                    <th key={i} className={i > 0 ? "is-num" : ""}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className={j > 0 ? "is-num" : ""}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ columns per day */

const COL_H = 236;
const COL_M = { l: 34, r: 8, t: 24, b: 26 };

/** One column per day of the month. days = [{ date: "2026-09-05", count }] */
export function DayColumns({ days, color }) {
  const { wrapRef, tip, showFor, hide } = useHoverTip();
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const update = () => setWidth(Math.max(280, el.clientWidth));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [wrapRef]);

  const n = days.length || 1;
  const counts = days.map((d) => d.count);
  const peak = Math.max(0, ...counts);
  const { max: yMax, ticks } = niceScale(peak, 4);
  const plotW = width - COL_M.l - COL_M.r;
  const plotH = COL_H - COL_M.t - COL_M.b;
  const band = plotW / n;
  const barW = Math.min(24, Math.max(3, band * 0.6));
  const baseY = COL_M.t + plotH;
  const yOf = (v) => COL_M.t + plotH * (1 - v / yMax);
  const labelEvery = Math.max(1, Math.ceil(30 / band));
  const peakIndex = peak > 0 ? counts.indexOf(peak) : -1;

  const bar = (i, v) => {
    const x = COL_M.l + band * i + (band - barW) / 2;
    const top = yOf(v);
    const r = Math.min(4, barW / 2, baseY - top);
    // 4px rounded data end, square at the baseline
    return `M${x} ${baseY}V${top + r}Q${x} ${top} ${x + r} ${top}H${x + barW - r}Q${x + barW} ${top} ${x + barW} ${top + r}V${baseY}Z`;
  };

  const show = (i, el) => {
    setActive(i);
    showFor(el, {
      title: dayLabel(days[i].date),
      value: formatNumber(days[i].count),
      unit: "ឯកសារ",
      color,
    });
  };
  const leave = () => {
    setActive(null);
    hide();
  };

  return (
    <div className="hm-chart" ref={wrapRef}>
      <svg width={width} height={COL_H} role="img" aria-label="ចំនួនឯកសារតាមថ្ងៃ">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={COL_M.l} x2={width - COL_M.r} y1={yOf(t)} y2={yOf(t)} className={t === 0 ? "hm-axis" : "hm-grid"} />
            <text x={COL_M.l - 8} y={yOf(t) + 4} textAnchor="end" className="hm-tick">
              {formatNumber(t)}
            </text>
          </g>
        ))}

        {active !== null && (
          <rect x={COL_M.l + band * active} y={COL_M.t} width={band} height={plotH} className="hm-hover-band" />
        )}

        {days.map((d, i) =>
          d.count > 0 ? <path key={d.date} d={bar(i, d.count)} fill={color} opacity={active === null || active === i ? 1 : 0.55} /> : null,
        )}

        {peakIndex >= 0 && (
          <text
            x={COL_M.l + band * peakIndex + band / 2}
            y={yOf(peak) - 7}
            textAnchor="middle"
            className="hm-peak"
          >
            {formatNumber(peak)}
          </text>
        )}

        {days.map((d, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <text key={`x${d.date}`} x={COL_M.l + band * i + band / 2} y={COL_H - 8} textAnchor="middle" className="hm-tick">
              {Number(d.date.slice(8))}
            </text>
          ) : null,
        )}

        {/* hit areas: full-height, wider than the bar */}
        {days.map((d, i) => (
          <rect
            key={`h${d.date}`}
            x={COL_M.l + band * i}
            y={COL_M.t}
            width={band}
            height={plotH}
            fill="transparent"
            tabIndex={0}
            aria-label={`${dayLabel(d.date)}: ${d.count}`}
            onPointerEnter={(e) => show(i, e.currentTarget)}
            onPointerLeave={leave}
            onFocus={(e) => show(i, e.currentTarget)}
            onBlur={leave}
          />
        ))}
      </svg>
      <Tip tip={tip} width={width} />
    </div>
  );
}

/* ------------------------------------------------------------------ sparkline */

/** 2px line with a ringed end-dot. values = [numbers] */
export function Sparkline({ values, color, width = 116, height = 34 }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(1, ...values);
  const pad = 5;
  const step = (width - pad * 2) / (values.length - 1);
  const pts = values.map((v, i) => [pad + i * step, pad + (height - pad * 2) * (1 - v / max)]);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg className="hm-spark" width={width} height={height} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="4" fill={color} stroke="var(--hm-surface)" strokeWidth="2" />
    </svg>
  );
}

/* ------------------------------------------------------------------ horizontal bars */

/** rows = [{ _id, name, count, other? }] — one colour, the number sits at the bar tip */
export function HBars({ rows, color, unit = "ឯកសារ" }) {
  const { wrapRef, tip, showFor, hide } = useHoverTip();
  const max = Math.max(1, ...rows.map((r) => r.count));
  const total = rows.reduce((s, r) => s + r.count, 0);
  return (
    <div className="hm-chart" ref={wrapRef}>
      <ul className="hm-hbars">
        {rows.map((r) => (
          <li
            key={r._id || r.name}
            className="hm-hrow"
            tabIndex={0}
            onPointerEnter={(e) =>
              showFor(e.currentTarget.querySelector(".hm-hbar"), {
                title: r.name,
                value: formatNumber(r.count),
                unit: `${unit} · ${percent(r.count, total)}%`,
                color: r.other ? "var(--hm-other)" : color,
              })
            }
            onPointerLeave={hide}
            onFocus={(e) =>
              showFor(e.currentTarget.querySelector(".hm-hbar"), {
                title: r.name,
                value: formatNumber(r.count),
                unit: `${unit} · ${percent(r.count, total)}%`,
                color: r.other ? "var(--hm-other)" : color,
              })
            }
            onBlur={hide}
          >
            <span className="hm-hname" title={r.name}>
              {r.name}
            </span>
            <span className="hm-htrack">
              <i className="hm-hbar" style={{ width: `${Math.max(1.5, (r.count / max) * 86)}%`, background: r.other ? "var(--hm-other)" : color }} />
              <b className="hm-hval">{formatNumber(r.count)}</b>
            </span>
          </li>
        ))}
      </ul>
      <Tip tip={tip} width={wrapRef.current ? wrapRef.current.clientWidth : 0} />
    </div>
  );
}

/* ------------------------------------------------------------------ stacked bar (part to whole) */

/** parts = [{ key, label, count, color }] — segments split by a 2px surface gap, legend below carries the numbers */
export function StackBar({ parts, unit = "ឯកសារ" }) {
  const { wrapRef, tip, showFor, hide } = useHoverTip();
  const total = parts.reduce((s, p) => s + p.count, 0);
  const show = (el, p) =>
    showFor(el, {
      title: p.label,
      value: formatNumber(p.count),
      unit: `${unit} · ${percent(p.count, total)}%`,
      color: p.color,
    });
  return (
    <div className="hm-chart" ref={wrapRef}>
      <div className="hm-stack" role="img" aria-label={parts.map((p) => `${p.label} ${p.count}`).join(", ")}>
        {total === 0 ? (
          <span className="hm-stack-empty" />
        ) : (
          parts
            .filter((p) => p.count > 0)
            .map((p) => (
              <span
                key={p.key}
                className="hm-seg-part"
                style={{ flexGrow: p.count, background: p.color }}
                tabIndex={0}
                onPointerEnter={(e) => show(e.currentTarget, p)}
                onPointerLeave={hide}
                onFocus={(e) => show(e.currentTarget, p)}
                onBlur={hide}
              />
            ))
        )}
      </div>
      <ul className="hm-legend">
        {parts.map((p) => (
          <li key={p.key}>
            <i style={{ background: p.color }} />
            <span className="hm-legend-name">{p.label}</span>
            <b>{formatNumber(p.count)}</b>
            <span className="hm-legend-pct">{percent(p.count, total)}%</span>
          </li>
        ))}
      </ul>
      <Tip tip={tip} width={wrapRef.current ? wrapRef.current.clientWidth : 0} />
    </div>
  );
}
