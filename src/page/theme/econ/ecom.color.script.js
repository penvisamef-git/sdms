// ecom.color.script.js
// Ecom Theme - Dark Red/Orange color configurations

export const ecomThemeColors = {
  // Primary colors - Dark Red/Orange
  primary: {
    main: '#dc2626',
    light: '#f87171',
    dark: '#b91c1c',
    gradient: 'linear-gradient(135deg, #7f1d1d, #dc2626)',
  },
  
  // Secondary colors - Orange Accents
  secondary: {
    main: '#f97316',
    light: '#fb923c',
    dark: '#ea580c',
  },
  
  // Background colors
  background: {
    app: '#0f0a0a',
    sidebar: '#1a0f0f',
    main: '#141010',
    card: '#1f1515',
    overlay: 'rgba(0, 0, 0, 0.8)',
  },
  
  // Text colors
  text: {
    primary: '#fef2f2',
    secondary: '#fca5a5',
    dark: '#ffffff',
    light: '#924040',
    white: '#ffffff',
    muted: '#7f2d2d',
  },
  
  // Border colors
  border: {
    light: '#3d1a1a',
    dashed: '#dc2626',
  },
  
  // Hover colors
  hover: {
    sidebar: '#2a1212',
    submenu: '#221010',
    logout: '#b91c1c',
    text: '#f87171',
  },
  
  // Active colors
  active: {
    background: '#dc2626',
    text: '#ffffff',
    sidebar: '#2a1212',
    textColor: '#f87171',
  },
  
  // Stat icon colors
  stat: {
    green: '#22c55e',
    dark: '#dc2626',
    orange: '#f97316',
  },
  
  // Chart colors
  chart: {
    blue: '#dc2626',
    orange: '#f97316',
    lightBlue: '#f87171',
    lightOrange: '#fb923c',
    gray: '#2a1212',
    barGradient: 'linear-gradient(to top, #dc2626, #f87171)',
  },
  
  // Schedule colors
  schedule: {
    dateCircle: '#dc2626',
  },
  
  // Shadow colors
  shadow: {
    default: 'rgba(220, 38, 38, 0.15)',
    light: 'rgba(220, 38, 38, 0.06)',
  },
  
  // Menu colors
  menu: {
    group: '#fca5a5',
    hover: '#2a1212',
    hoverText: '#f87171',
    open: '#2a1212',
    openText: '#f87171',
    submenu: '#fca5a5',
    submenuHover: '#221010',
    submenuHoverText: '#f87171',
    submenuActiveBg: '#dc2626',
    submenuActiveText: '#ffffff',
  },
  
  // Input colors
  input: {
    background: '#dc2626',
    text: '#ffffff',
    placeholder: '#fca5a5',
  },
  
  // Button colors
  button: {
    logoutBg: '#dc2626',
    logoutHover: '#b91c1c',
    text: '#ffffff',
  },
  
  // Rating
  rating: {
    background: '#1f1515',
    shadow: 'rgba(220, 38, 38, 0.1)',
  },
  
  // Arrow
  arrow: {
    color: '#22c55e',
  },
  
  // Section title
  sectionTitle: {
    background: '#dc2626',
    text: '#ffffff',
  },
};

// Function to apply ecom theme colors to CSS variables
export const applyEcomTheme = (colors = ecomThemeColors) => {
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

// Auto-apply ecom theme on import
applyEcomTheme(ecomThemeColors);

export default ecomThemeColors;