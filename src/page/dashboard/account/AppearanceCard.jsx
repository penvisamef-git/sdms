import React, { useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { getThemeMode, setThemeMode } from "../../theme/default/color.script";

const OPTIONS = [
  { value: "system", label: "ប្រព័ន្ធ", Icon: Monitor },
  { value: "light", label: "ភ្លឺ", Icon: Sun },
  { value: "dark", label: "ងងឹត", Icon: Moon },
];

/** Light / dark / follow-the-system switch. The choice is kept in this browser. */
export default function AppearanceCard() {
  const [mode, setMode] = useState(getThemeMode());

  const pick = (value) => {
    setThemeMode(value);
    setMode(value);
  };

  return (
    <section className="md-card ac-card ac-wide">
      <header className="ac-card-head">
        <h3>ទម្រង់បង្ហាញ</h3>
        <p>ជ្រើសរើសពណ៌ភ្លឺ ឬងងឹត ឬតាមការកំណត់ឧបករណ៍</p>
      </header>
      <div className="ac-seg" role="radiogroup" aria-label="ទម្រង់បង្ហាញ">
        {OPTIONS.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mode === value}
            className={`ac-seg-item${mode === value ? " is-on" : ""}`}
            onClick={() => pick(value)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
