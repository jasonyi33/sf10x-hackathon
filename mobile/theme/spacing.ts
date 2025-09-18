export const spacing = {
  // Base spacing units
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
  '5xl': 128,

  // Layout spacing
  layout: {
    screenPadding: 16,
    cardPadding: 16,
    listItemPadding: 12,
    sectionSpacing: 24,
  },

  // Component spacing
  component: {
    buttonPadding: {
      horizontal: 24,
      vertical: 12,
    },
    inputPadding: {
      horizontal: 16,
      vertical: 12,
    },
    chipPadding: {
      horizontal: 12,
      vertical: 6,
    },
  },
};

export type Spacing = typeof spacing;