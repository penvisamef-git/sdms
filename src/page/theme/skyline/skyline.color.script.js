// skyline.color.script.js
// Skyline Theme - All color configurations

export const skylineThemeColors = {
  // Primary colors - Skyline Blue
  primary: {
    main: '#2563eb',
    light: '#3b82f6',
    dark: '#1d4ed8',
    gradient: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
  },
  
  // Background colors
  background: {
    app: '#f0f4ff',
    sidebar: '#ffffff',
    main: '#f8fafc',
    card: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Text colors
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    dark: '#0f172a',
    light: '#94a3b8',
    white: '#ffffff',
    muted: '#94a3b8',
  },
  
  // Border colors
  border: {
    light: '#e2e8f0',
    dashed: '#3b82f6',
  },
  
  // Hover colors
  hover: {
    sidebar: '#eff6ff',
    submenu: '#f1f5f9',
    logout: '#1d4ed8',
    text: '#2563eb',
  },
  
  // Active colors
  active: {
    background: '#2563eb',
    text: '#ffffff',
    sidebar: '#dbeafe',
    textColor: '#2563eb',
  },
  
  // Stat icon colors
  stat: {
    green: '#10b981',
    dark: '#2563eb',
  },
  
  // Chart colors
  chart: {
    blue: '#3b82f6',
    orange: '#f59e0b',
    lightBlue: '#60a5fa',
    lightOrange: '#fbbf24',
    gray: '#e2e8f0',
    barGradient: 'linear-gradient(to top, #2563eb, #60a5fa)',
  },
  
  // Schedule colors
  schedule: {
    dateCircle: '#2563eb',
  },
  
  // Shadow colors
  shadow: {
    default: 'rgba(37, 99, 235, 0.15)',
    light: 'rgba(0, 0, 0, 0.06)',
  },
  
  // Menu colors
  menu: {
    group: '#64748b',
    hover: '#eff6ff',
    hoverText: '#2563eb',
    open: '#dbeafe',
    openText: '#2563eb',
    submenu: '#64748b',
    submenuHover: '#f1f5f9',
    submenuHoverText: '#2563eb',
    submenuActiveBg: '#2563eb',
    submenuActiveText: '#ffffff',
  },
  
  // Input colors
  input: {
    background: '#2563eb',
    text: '#ffffff',
    placeholder: '#bfdbfe',
  },
  
  // Button colors
  button: {
    logoutBg: '#2563eb',
    logoutHover: '#1d4ed8',
    text: '#ffffff',
  },
  
  // Rating
  rating: {
    background: '#ffffff',
    shadow: 'rgba(0, 0, 0, 0.06)',
  },
  
  // Arrow
  arrow: {
    color: '#10b981',
  },
  
  // Section title
  sectionTitle: {
    background: '#2563eb',
    text: '#ffffff',
  },
};

// Function to apply skyline theme colors to CSS variables
export const applySkylineTheme = (colors = skylineThemeColors) => {
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

// Auto-apply skyline theme on import
applySkylineTheme(skylineThemeColors);

export default skylineThemeColors;