// Project palette — src/theme/theme-config.ts

export const tk = {
  inkLighter: '#72777A',   // grey.500
  inkLight: '#6C7072',     // grey.600
  ink: '#404446',          // grey.700
  inkDark: '#202325',      // grey.800
  inkDarkest: '#0F1213',   // grey.900

  skyLightest: '#F7F9FA',  // grey.50
  skyLighter: '#F2F4F5',   // grey.100
  skyLight: '#E3E5E5',     // grey.200
  skyBase: '#CDCFD0',      // grey.300
  skyDark: '#979C9E',      // grey.400

  greenLightest: '#9BF093', // success.lighter
  green: '#2DE21D',         // success.main
  greenDark: '#047800',     // success.dark
  greenDarkest: '#1C3E03',  // success.darker

  redLightest: '#FF9898',   // error.lighter
  redBase: '#FF5247',       // error.main
  redDark: '#df2521',       // error.dark
  redDarkest: '#D3180C',    // error.darker

  blueLightest: '#9BDCFD',  // info.lighter
  blueBase: '#48A7F8',      // info.main
  blueDark: '#1260af',      // info.dark
  blueDarkest: '#0051A7',   // info.darker

  yellowLightest: '#FFD188', // warning.lighter
  yellowBase: '#FFB323',     // warning.main
  yellowDark: '#c37717',     // warning.dark
  yellowDarkest: '#A05E03',  // warning.darker

  white: '#FFFFFF',
};

export const fmtNum = (v: number | string): string =>
  String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export const fmtEur = (v: number | string): string =>
  typeof v === 'number' ? `${fmtNum(v)}€` : String(v);

export const fmtN = (v: number | string): string =>
  typeof v === 'number' ? fmtNum(v) : String(v);

export const fmtT = (v: number | string): string => String(v);

export function badgeColors(delta: string) {
  if (delta.startsWith('▲')) return { bg: tk.greenLightest, color: tk.greenDarkest };
  if (delta.startsWith('▼')) return { bg: tk.redLightest, color: tk.redDarkest };
  return { bg: tk.yellowLightest, color: tk.yellowDarkest };
}
