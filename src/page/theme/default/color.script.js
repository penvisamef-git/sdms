// color.script.js
// All color configurations for the theme

export const themeColors = {
  // Primary colors
  primary: {
    main: '#005a3d',
    light: '#1c9c95',
    dark: '#056862',
  },
  
  // Background colors
  background: {
    app: '#6f9d94',
    sidebar: '#f8f9f7',
    main: '#f6f7f5',
    card: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.45)',
  },
  
  // Text colors
  text: {
    primary: '#176e6a',
    secondary: '#777777',
    dark: '#333333',
    light: '#888888',
    white: '#ffffff',
    muted: '#999999',
  },
  
  // Border colors
  border: {
    light: '#dddddd',
    dashed: '#2b9d97',
  },
  
  // Hover colors
  hover: {
    sidebar: '#e9f5f3',
    submenu: '#f0f8f7',
    logout: '#056862',
    text: '#087d76',
  },
  
  // Active colors
  active: {
    background: '#087d76',
    text: '#ffffff',
    sidebar: '#e9f5f3',
    textColor: '#087d76',
  },
  
  // Stat icon colors
  stat: {
    green: '#168b82',
    dark: '#08736e',
  },
  
  // Chart colors
  chart: {
    blue: '#1596b5',
    orange: '#f0a51a',
    lightBlue: '#1978b5',
    lightOrange: '#f2a51c',
    gray: '#e8eeee',
    barGradient: 'linear-gradient(to top, #087bb6, #0b5f96)',
  },
  
  // Schedule colors
  schedule: {
    dateCircle: '#087b75',
  },
  
  // Shadow colors
  shadow: {
    default: 'rgba(0, 0, 0, 0.2)',
    light: 'rgba(0, 0, 0, 0.08)',
  },
  
  // Menu colors
  menu: {
    group: '#777777',
    hover: '#e9f5f3',
    hoverText: '#087d76',
    open: '#e9f5f3',
    openText: '#087d76',
    submenu: '#888888',
    submenuHover: '#f0f8f7',
    submenuHoverText: '#087d76',
    submenuActiveBg: '#087d76',
    submenuActiveText: '#ffffff',
  },
  
  // Input colors
  input: {
    background: '#087c76',
    text: '#ffffff',
    placeholder: '#d5eeee',
  },
  
  // Button colors
  button: {
    logoutBg: '#087f79',
    logoutHover: '#056862',
    text: '#ffffff',
  },
  
  // Rating
  rating: {
    background: '#ffffff',
    shadow: 'rgba(0, 0, 0, 0.08)',
  },
  
  // Arrow
  arrow: {
    color: '#52ad77',
  },
  
  // Section title
  sectionTitle: {
    background: '#087b75',
    text: '#ffffff',
  },
};

// Function to apply theme colors to CSS variables
export const applyTheme = (colors = themeColors) => {
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

// Auto-apply theme on import
applyTheme(themeColors);

export default themeColors;