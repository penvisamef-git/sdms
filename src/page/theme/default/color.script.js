// color.script.js
// SDMS design v2 - "A · Western Clean" in the ministry green (same as the mobile app).
// Light and dark palettes; every key becomes a CSS variable --color-<group>-<key>.

export const lightColors = {
  // Primary colors
  primary: {
    main: '#198754',
    light: '#20c997',
    dark: '#0f5132',
  },

  // Background colors
  background: {
    app: '#f6f8fa',
    sidebar: '#ffffff',
    main: '#f6f8fa',
    card: '#ffffff',
    overlay: 'rgba(10, 30, 20, 0.45)',
  },

  // Text colors
  text: {
    primary: '#0f5132',
    secondary: '#6c757d',
    dark: '#1a1d21',
    light: '#868e96',
    white: '#ffffff',
    muted: '#868e96',
  },

  // Border colors
  border: {
    light: '#e9ecef',
    dashed: '#198754',
  },

  // Hover colors
  hover: {
    sidebar: '#e8f3ec',
    submenu: '#f1f8f4',
    logout: '#146c43',
    text: '#0f5132',
  },

  // Active colors
  active: {
    background: '#198754',
    text: '#ffffff',
    sidebar: '#e8f3ec',
    textColor: '#0f5132',
  },

  // Stat icon colors
  stat: {
    green: '#198754',
    dark: '#0f5132',
  },

  // Chart colors
  chart: {
    blue: '#2a78d6',
    orange: '#e8890c',
    lightBlue: '#2a78d6',
    lightOrange: '#e8890c',
    gray: '#e9ecef',
    barGradient: 'linear-gradient(to top, #198754, #0f5132)',
  },

  // Schedule colors
  schedule: {
    dateCircle: '#198754',
  },

  // Shadow colors
  shadow: {
    default: 'rgba(15, 81, 50, 0.10)',
    light: 'rgba(15, 81, 50, 0.06)',
  },

  // Menu colors
  menu: {
    group: '#868e96',
    hover: '#e8f3ec',
    hoverText: '#0f5132',
    open: '#e8f3ec',
    openText: '#0f5132',
    submenu: '#6c757d',
    submenuHover: '#f1f8f4',
    submenuHoverText: '#0f5132',
    submenuActiveBg: '#198754',
    submenuActiveText: '#ffffff',
  },

  // Input colors
  input: {
    background: '#198754',
    text: '#ffffff',
    placeholder: '#d3ecdd',
  },

  // Button colors
  button: {
    logoutBg: '#198754',
    logoutHover: '#146c43',
    text: '#ffffff',
  },

  // Rating
  rating: {
    background: '#ffffff',
    shadow: 'rgba(15, 81, 50, 0.06)',
  },

  // Arrow
  arrow: {
    color: '#198754',
  },

  // Section title
  sectionTitle: {
    background: '#198754',
    text: '#ffffff',
  },

  // Neutral surfaces used by the page css (cards, tables, fields)
  surface: {
    card: '#ffffff',
    raised: '#f6f8fa',
    soft: '#e8f3ec',
    border: '#e9ecef',
    borderStrong: '#ced4da',
    text: '#1a1d21',
    muted: '#6c757d',
    field: '#ffffff',
    dangerSoft: '#fdecee',
    warnSoft: '#fff3df',
    infoSoft: '#e6eefb',
  },
};

export const darkColors = {
  primary: {
    main: '#5fe0b8',
    light: '#20c997',
    dark: '#8cf0d0',
  },
  background: {
    app: '#0b1510',
    sidebar: '#121f18',
    main: '#0b1510',
    card: '#121f18',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
  text: {
    primary: '#8cf0d0',
    secondary: '#9db1a6',
    dark: '#e6efea',
    light: '#7f948a',
    white: '#ffffff',
    muted: '#7f948a',
  },
  border: {
    light: '#22372b',
    dashed: '#5fe0b8',
  },
  hover: {
    sidebar: '#1b3a2c',
    submenu: '#16291f',
    logout: '#8cf0d0',
    text: '#5fe0b8',
  },
  active: {
    background: '#5fe0b8',
    text: '#06281c',
    sidebar: '#1b3a2c',
    textColor: '#5fe0b8',
  },
  stat: {
    green: '#5fe0b8',
    dark: '#8cf0d0',
  },
  chart: {
    blue: '#5b9df0',
    orange: '#f0a23a',
    lightBlue: '#5b9df0',
    lightOrange: '#f0a23a',
    gray: '#22372b',
    barGradient: 'linear-gradient(to top, #5fe0b8, #20a878)',
  },
  schedule: {
    dateCircle: '#5fe0b8',
  },
  shadow: {
    default: 'rgba(0, 0, 0, 0.5)',
    light: 'rgba(0, 0, 0, 0.35)',
  },
  menu: {
    group: '#7f948a',
    hover: '#1b3a2c',
    hoverText: '#5fe0b8',
    open: '#1b3a2c',
    openText: '#5fe0b8',
    submenu: '#9db1a6',
    submenuHover: '#16291f',
    submenuHoverText: '#5fe0b8',
    submenuActiveBg: '#5fe0b8',
    submenuActiveText: '#06281c',
  },
  input: {
    background: '#1b3a2c',
    text: '#e6efea',
    placeholder: '#7f948a',
  },
  button: {
    logoutBg: '#5fe0b8',
    logoutHover: '#8cf0d0',
    text: '#06281c',
  },
  rating: {
    background: '#121f18',
    shadow: 'rgba(0, 0, 0, 0.35)',
  },
  arrow: {
    color: '#5fe0b8',
  },
  sectionTitle: {
    background: '#1b3a2c',
    text: '#8cf0d0',
  },
  surface: {
    card: '#121f18',
    raised: '#182a20',
    soft: '#1b3a2c',
    border: '#22372b',
    borderStrong: '#2e4a3b',
    text: '#e6efea',
    muted: '#9db1a6',
    field: '#0f1b14',
    dangerSoft: '#3a1a1f',
    warnSoft: '#3a2b12',
    infoSoft: '#16283f',
  },
};

// kept for the places that read the static light palette
export const themeColors = lightColors;

// ---- mode handling: 'system' | 'light' | 'dark' -------------------------------------------
const STORAGE_KEY = 'sdms.theme';

export const getThemeMode = () => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch (e) {
    return 'system';
  }
};

const prefersDark = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

export const isDarkNow = (mode = getThemeMode()) => (mode === 'system' ? prefersDark() : mode === 'dark');

// Function to apply theme colors to CSS variables
export const applyTheme = (colors = lightColors) => {
  const root = document.documentElement;

  Object.entries(colors).forEach(([category, values]) => {
    Object.entries(values).forEach(([key, value]) => {
      root.style.setProperty(`--color-${category}-${key}`, value);
    });
  });
};

export const applyThemeMode = (mode = getThemeMode()) => {
  const dark = isDarkNow(mode);
  applyTheme(dark ? darkColors : lightColors);
  const root = document.documentElement;
  root.setAttribute('data-theme', dark ? 'dark' : 'light');
  root.style.colorScheme = dark ? 'dark' : 'light';
};

export const setThemeMode = (mode) => {
  try {
    if (mode === 'light' || mode === 'dark') localStorage.setItem(STORAGE_KEY, mode);
    else localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    /* private mode: the choice only lasts for this visit */
  }
  applyThemeMode(mode);
  window.dispatchEvent(new CustomEvent('sdms-theme', { detail: mode }));
};

// Auto-apply theme on import, and follow the system setting while the mode is 'system'
applyThemeMode();
if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => {
    if (getThemeMode() === 'system') applyThemeMode('system');
  };
  if (mq.addEventListener) mq.addEventListener('change', onChange);
}
