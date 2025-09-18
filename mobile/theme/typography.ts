import { Platform } from 'react-native';

export const typography = {
  // Font families
  fontFamily: {
    regular: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
    medium: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
    }),
    semibold: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
    }),
    bold: Platform.select({
      ios: 'System',
      android: 'Roboto-Bold',
    }),
  },

  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  // Font weights
  fontWeight: {
    normal: '400' as '400',
    medium: '500' as '500',
    semibold: '600' as '600',
    bold: '700' as '700',
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  // Letter spacing
  letterSpacing: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.25,
    wider: 0.5,
    widest: 1,
  },

  // Text styles presets
  styles: {
    largeTitle: {
      fontSize: 34,
      fontWeight: '700' as '700',
      letterSpacing: -0.5,
      lineHeight: 41,
    },
    title1: {
      fontSize: 28,
      fontWeight: '700' as '700',
      letterSpacing: -0.25,
      lineHeight: 34,
    },
    title2: {
      fontSize: 22,
      fontWeight: '600' as '600',
      letterSpacing: -0.25,
      lineHeight: 28,
    },
    title3: {
      fontSize: 20,
      fontWeight: '600' as '600',
      letterSpacing: -0.25,
      lineHeight: 24,
    },
    headline: {
      fontSize: 17,
      fontWeight: '600' as '600',
      letterSpacing: -0.25,
      lineHeight: 22,
    },
    body: {
      fontSize: 17,
      fontWeight: '400' as '400',
      letterSpacing: 0,
      lineHeight: 22,
    },
    callout: {
      fontSize: 16,
      fontWeight: '400' as '400',
      letterSpacing: 0,
      lineHeight: 21,
    },
    subheadline: {
      fontSize: 15,
      fontWeight: '400' as '400',
      letterSpacing: 0,
      lineHeight: 20,
    },
    footnote: {
      fontSize: 13,
      fontWeight: '400' as '400',
      letterSpacing: 0,
      lineHeight: 18,
    },
    caption1: {
      fontSize: 12,
      fontWeight: '400' as '400',
      letterSpacing: 0,
      lineHeight: 16,
    },
    caption2: {
      fontSize: 11,
      fontWeight: '400' as '400',
      letterSpacing: 0.25,
      lineHeight: 13,
    },
  },
};

export type Typography = typeof typography;