import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { shadows } from './shadows';

export const theme = {
  colors,
  typography,
  spacing,
  shadows,

  // Border radius
  borderRadius: {
    none: 0,
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    full: 9999,
  },

  // Opacity
  opacity: {
    disabled: 0.5,
    overlay: 0.7,
    subtle: 0.1,
  },

  // Transitions
  animation: {
    fast: 150,
    normal: 250,
    slow: 350,
  },

  // Z-index layers
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    overlay: 30,
    modal: 40,
    popover: 50,
    toast: 60,
  },

  // Breakpoints (for responsive design if needed)
  breakpoints: {
    sm: 320,
    md: 768,
    lg: 1024,
  },
};

export type Theme = typeof theme;

// Export everything for convenience
export { colors } from './colors';
export { typography } from './typography';
export { spacing } from './spacing';
export { shadows } from './shadows';