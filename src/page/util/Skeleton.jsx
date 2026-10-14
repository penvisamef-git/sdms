import React from "react";

// Shimmering placeholders shown instead of spinners / "loading..." text (styles: index.css, class "sk").

export function Sk({ w, h = 14, r = 8, style }) {
  return <span className="sk" style={{ width: w, height: h, borderRadius: r, ...style }} aria-hidden="true" />;
}

// A few text lines inside a card or modal
export function SkLines({ rows = 4 }) {
  return (
    <div className="sk-lines" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <Sk key={i} w={i % 3 === 2 ? "55%" : i % 2 ? "80%" : "100%"} h={14} />
      ))}
    </div>
  );
}

// Table rows (use inside <tbody>)
export function SkTableRows({ cols = 4, rows = 6 }) {
  return Array.from({ length: rows }).map((_, r) => (
    <tr key={r} className="sk-row" aria-busy="true">
      {Array.from({ length: cols }).map((__, c) => (
        <td key={c}>
          <Sk w={c === 0 ? "40%" : c % 2 ? "85%" : "65%"} h={14} />
        </td>
      ))}
    </tr>
  ));
}

// Home dashboard: tiles, a chart and a list
export function SkHome() {
  return (
    <div className="sk-home" aria-busy="true">
      <div className="sk-tiles">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="sk-tile" key={i}>
            <Sk w={32} h={32} r={10} />
            <Sk w={64} h={26} style={{ marginTop: 14 }} />
            <Sk w="70%" h={12} style={{ marginTop: 10 }} />
          </div>
        ))}
      </div>
      <div className="sk-panels">
        <div className="sk-tile">
          <Sk w={150} h={16} />
          <Sk w="100%" h={180} r={12} style={{ marginTop: 16 }} />
        </div>
        <div className="sk-tile">
          <Sk w={120} h={16} />
          <SkLines rows={6} />
        </div>
      </div>
    </div>
  );
}
