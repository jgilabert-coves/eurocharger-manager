import type { CommonColors } from '@mui/material/styles/createPalette';

import type { PaletteColorNoChannels } from './core/palette';
import type { ThemeDirection, ThemeColorScheme, ThemeCssVariables } from './types';

// ----------------------------------------------------------------------

type ThemeConfig = {
  classesPrefix: string;
  modeStorageKey: string;
  direction: ThemeDirection;
  defaultMode: ThemeColorScheme;
  cssVariables: ThemeCssVariables;
  fontFamily: Record<'primary' | 'secondary', string>;
  palette: Record<
    'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error',
    PaletteColorNoChannels
  > & {
    common: Pick<CommonColors, 'black' | 'white'>;
    grey: Record<
      '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900',
      string
    >;
  };
};

export const themeConfig: ThemeConfig = {
  /** **************************************
   * Base
   *************************************** */
  direction: 'ltr',
  defaultMode: 'light',
  modeStorageKey: 'theme-mode',
  classesPrefix: 'minimal',
  /** **************************************
   * Typography
   *************************************** */
  fontFamily: {
    primary: 'DM Sans Variable',
    secondary: 'sans-serif',
  },
  /** **************************************
   * Palette
   *************************************** */
  palette: {
    primary: {
      lighter: '#9BF093',
      light: '#5BEF4E',
      main: '#2DE21D',
      dark: '#047800',
      darker: '#1C3E03',
      contrastText: '#0F1213',
    },
    secondary: {
      lighter: '#F2F4F5',
      light: '#E3E5E5',
      main: '#CDCFD0',
      dark: '#aaaaae',
      darker: '#979C9E',
      contrastText: '#FFFFFF',
    },
    info: {
      lighter: '#9BDCFD',
      light: '#6EC2FB',
      main: '#48A7F8',
      dark: '#1260af',
      darker: '#0051A7',
      contrastText: '#FFFFFF',
    },
    success: {
      lighter: '#9BF093',
      light: '#5BEF4E',
      main: '#2DE21D',
      dark: '#047800',
      darker: '#1C3E03',
      contrastText: '#0F1213',
    },
    warning: {
      lighter: '#FFD188',
      light: '#FFC462',
      main: '#FFB323',
      dark: '#c37717',
      darker: '#A05E03',
      contrastText: '#1C252E',
    },
    error: {
      lighter: '#FF9898',
      light: '#FF6D6D',
      main: '#FF5247',
      dark: '#df2521',
      darker: '#D3180C',
      contrastText: '#FFFFFF',
    },
    grey: {
      '50': '#F7F9FA',
      '100': '#F2F4F5',
      '200': '#E3E5E5',
      '300': '#CDCFD0',
      '400': '#979C9E',
      '500': '#72777A',
      '600': '#6C7072',
      '700': '#404446',
      '800': '#202325',
      '900': '#0F1213',
    },
    common: { black: '#000000', white: '#FFFFFF' },
  },
  /** **************************************
   * Css variables
   *************************************** */
  cssVariables: {
    cssVarPrefix: '',
    colorSchemeSelector: 'data-color-scheme',
  },
};
