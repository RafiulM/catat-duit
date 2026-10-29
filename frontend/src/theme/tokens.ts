import { Platform } from 'react-native';

/**
 * Design tokens pulled from the Catat Duit prototype (Progress Weave foundation).
 * Deep teal owns structure, mint and lime own action, sand carries long sessions.
 */
export const colors = {
  primary: '#046645',
  primaryActive: '#0F4D38',
  onPrimary: '#CDFACE',
  secondary: '#CDFACE',
  onSecondary: '#046645',
  canvas: '#FFFFFF',
  surface: '#FAF9F7',
  surfaceMuted: '#F7F6F2',
  text: '#001F1F',
  textMuted: '#455252',
  textSubtle: '#6A7878',
  textDisabled: '#889494',
  border: '#C4CCCC',
  borderSubtle: '#EBE7E1',
  focusRing: '#33B88C',
  focusSecondary: '#A9EBA9',
  selection: '#CDFACE',
  lime: '#D0FF64',
  mint: '#CDFACE',
  blue: '#67E2EB',
  violet: '#7070FF',
  pink: '#FAB8FF',
  yellow: '#FFDD99',
  turquoise: '#51E0CD',
  positive: '#046645',
  positiveSoft: '#C4F5DB',
  warning: '#A36A14',
  warningSoft: '#FFFAE6',
  danger: '#B8252F',
  dangerSoft: '#FCEFF1',
  overlay: 'rgba(0, 31, 31, 0.38)',
  transparent: 'transparent',
} as const;

export const gradients = {
  activeStrand: ['#B8B8FF', '#51E0CD', '#B8B8FF'] as const,
  completionInsight: ['rgba(250,184,255,0.4)', '#FFF3C2'] as const,
};

export const space = {
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radii = {
  control: 12,
  card: 20,
  panel: 24,
  pill: 999,
} as const;

export const fonts = {
  display: 'CalSans-Medium',
  displaySemiBold: 'CalSans-SemiBold',
  body: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

type TextStyleToken = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
};

export const type = {
  display: {
    fontFamily: fonts.display,
    fontSize: 48,
    lineHeight: 48,
    letterSpacing: -1.15,
  },
  headingLg: {
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.8,
  },
  headingMd: {
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.47,
  },
  headingSm: {
    fontFamily: fonts.display,
    fontSize: 27,
    lineHeight: 32,
    letterSpacing: 0,
  },
  bodyLg: {
    fontFamily: fonts.body,
    fontSize: 20,
    lineHeight: 30,
  },
  bodyMd: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySm: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  labelSm: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.12,
  },
} satisfies Record<string, TextStyleToken>;

export const shadow = Platform.select({
  ios: {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  android: {
    elevation: 2,
    shadowColor: colors.text,
  },
  default: {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
});

export const shadowRaised = Platform.select({
  ios: {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
  },
  android: {
    elevation: 8,
    shadowColor: colors.text,
  },
  default: {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
  },
});

export const motion = {
  control: 180,
  card: 240,
} as const;

export const layout = {
  pageMaxWidth: 480,
  contentPadding: space.xl,
  tabBarHeight: 64,
  topBarHeight: 56,
} as const;
