// natural.color.script.js
// Natural Theme - Light & Earthy color configurations

export const naturalThemeColors = {
  // Primary colors - Earthy Green
  primary: {
    main: '#2d6a4f',
    light: '#409f7a',
    dark: '#1b4332',
    gradient: 'linear-gradient(135deg, #1b4332, #2d6a4f)',
  },
  
  // Secondary colors - Warm Accents
  secondary: {
    main: '#d4a373',
    light: '#e9c9a5',
    dark: '#b8875a',
  },
  
  // Background colors - Light & Natural
  background: {
    app: '#f5f0eb',
    sidebar: '#ffffff',
    main: '#faf8f6',
    card: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.3)',
  },
  
  // Text colors
  text: {
    primary: '#2d2d2d',
    secondary: '#6b6b6b',
    dark: '#1a1a1a',
    light: '#9e9e9e',
    white: '#ffffff',
    muted: '#a8a8a8',
  },
  
  // Border colors
  border: {
    light: '#e8e0d8',
    dashed: '#2d6a4f',
  },
  
  // Hover colors
  hover: {
    sidebar: '#f0ebe6',
    submenu: '#f5f0eb',
    logout: '#1b4332',
    text: '#2d6a4f',
  },
  
  // Active colors
  active: {
    background: '#2d6a4f',
    text: '#ffffff',
    sidebar: '#e8f0ec',
    textColor: '#2d6a4f',
  },
  
  // Stat icon colors
  stat: {
    green: '#2d6a4f',
    dark: '#1b4332',
    warm: '#d4a373',
  },
  
  // Chart colors
  chart: {
    blue: '#2d6a4f',
    orange: '#d4a373',
    lightBlue: '#409f7a',
    lightOrange: '#e9c9a5',
    gray: '#e8e0d8',
    barGradient: 'linear-gradient(to top, #2d6a4f, #409f7a)',
  },
  
  // Schedule colors
  schedule: {
    dateCircle: '#2d6a4f',
  },
  
  // Shadow colors - Soft & Natural
  shadow: {
    default: 'rgba(45, 106, 79, 0.08)',
    light: 'rgba(0, 0, 0, 0.04)',
  },
  
  // Menu colors
  menu: {
    group: '#6b6b6b',
    hover: '#f0ebe6',
    hoverText: '#2d6a4f',
    open: '#e8f0ec',
    openText: '#2d6a4f',
    submenu: '#6b6b6b',
    submenuHover: '#f5f0eb',
    submenuHoverText: '#2d6a4f',
    submenuActiveBg: '#2d6a4f',
    submenuActiveText: '#ffffff',
  },
  
  // Input colors
  input: {
    background: '#2d6a4f',
    text: '#ffffff',
    placeholder: '#b8c9c0',
  },
  
  // Button colors
  button: {
    logoutBg: '#2d6a4f',
    logoutHover: '#1b4332',
    text: '#ffffff',
  },
  
  // Rating
  rating: {
    background: '#ffffff',
    shadow: 'rgba(0, 0, 0, 0.04)',
  },
  
  // Arrow
  arrow: {
    color: '#2d6a4f',
  },
  
  // Section title
  sectionTitle: {
    background: '#2d6a4f',
    text: '#ffffff',
  },
  
  // Natural Accents
  leaf: '#2d6a4f',
  wood: '#d4a373',
  sand: '#f5f0eb',
  stone: '#8c8c8c',
};

// Function to apply natural theme colors to CSS variables
export const applyNaturalTheme = (colors = naturalThemeColors) => {
  const root = document.documentElement;
  
  // Set CSS custom properties
  Object.entries(colors).forEach(([category, values]) => {
    Object.entries(values).forEach(([key, value]) => {
      if (typeof value === 'object') {
        // Handle nested objects (like gradient)
        Object.entries(value).forEach(([subKey, subValue]) => {
          const varName = `--color-${category}-${key}-${subKey}`;
          root.style.setProperty(varName, subValue);
        });
      } else {
        const varName = `--color-${category}-${key}`;
        root.style.setProperty(varName, value);
      }
    });
  });
};

// Auto-apply natural theme on import
applyNaturalTheme(naturalThemeColors);

export default naturalThemeColors;