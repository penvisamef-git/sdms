// tech.color.script.js
// Tech Theme - All color configurations

export const techThemeColors = {
  // Primary colors - Tech Dark
  primary: {
    main: '#00d4ff',
    light: '#4de8ff',
    dark: '#0099cc',
    gradient: 'linear-gradient(135deg, #0a0e1a, #1a2332)',
  },
  
  // Background colors
  background: {
    app: '#0a0e1a',
    sidebar: '#0d1424',
    main: '#111927',
    card: '#1a2332',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  
  // Text colors
  text: {
    primary: '#e8edf5',
    secondary: '#8899bb',
    dark: '#ffffff',
    light: '#556688',
    white: '#ffffff',
    muted: '#445566',
  },
  
  // Border colors
  border: {
    light: '#1e2d42',
    dashed: '#00d4ff',
  },
  
  // Hover colors
  hover: {
    sidebar: '#1a2a40',
    submenu: '#162035',
    logout: '#0099cc',
    text: '#00d4ff',
  },
  
  // Active colors
  active: {
    background: '#00d4ff',
    text: '#0a0e1a',
    sidebar: '#1a2a40',
    textColor: '#00d4ff',
  },
  
  // Stat icon colors
  stat: {
    green: '#00ff88',
    dark: '#00d4ff',
  },
  
  // Chart colors
  chart: {
    blue: '#00d4ff',
    orange: '#ff6b35',
    lightBlue: '#4de8ff',
    lightOrange: '#ff8c5a',
    gray: '#1e2d42',
    barGradient: 'linear-gradient(to top, #00d4ff, #4de8ff)',
  },
  
  // Schedule colors
  schedule: {
    dateCircle: '#00d4ff',
  },
  
  // Shadow colors
  shadow: {
    default: 'rgba(0, 212, 255, 0.1)',
    light: 'rgba(0, 212, 255, 0.05)',
  },
  
  // Menu colors
  menu: {
    group: '#8899bb',
    hover: '#1a2a40',
    hoverText: '#00d4ff',
    open: '#1a2a40',
    openText: '#00d4ff',
    submenu: '#8899bb',
    submenuHover: '#162035',
    submenuHoverText: '#00d4ff',
    submenuActiveBg: '#00d4ff',
    submenuActiveText: '#0a0e1a',
  },
  
  // Input colors
  input: {
    background: '#00d4ff',
    text: '#0a0e1a',
    placeholder: '#6688aa',
  },
  
  // Button colors
  button: {
    logoutBg: '#00d4ff',
    logoutHover: '#0099cc',
    text: '#0a0e1a',
  },
  
  // Rating
  rating: {
    background: '#1a2332',
    shadow: 'rgba(0, 212, 255, 0.05)',
  },
  
  // Arrow
  arrow: {
    color: '#00ff88',
  },
  
  // Section title
  sectionTitle: {
    background: '#00d4ff',
    text: '#0a0e1a',
  },
};

// Function to apply tech theme colors to CSS variables
export const applyTechTheme = (colors = techThemeColors) => {
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

// Auto-apply tech theme on import
applyTechTheme(techThemeColors);

export default techThemeColors;