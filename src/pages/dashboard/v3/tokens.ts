export const tk = {
  inkLighter: '#6b7280',
  inkLight: '#4b5563',
  ink: '#374151',
  inkDark: '#1f2937',
  inkDarkest: '#030712',
  skyLightest: '#f9fafb',
  skyLighter: '#f3f4f6',
  skyLight: '#e5e7eb',
  skyBase: '#d1d5db',
  skyDark: '#9ca3af',
  greenLightest: '#f0fdf0',
  green: '#22c55e',
  greenDarkest: '#14532d',
  redLightest: '#fff0f0',
  redBase: '#ef4444',
  redDarkest: '#cc0000',
  blueLightest: '#e0f0ff',
  blueBase: '#3b82f6',
  blueDarkest: '#0039a6',
  yellowLightest: '#fffbeb',
  yellowBase: '#f59e0b',
  yellowDarkest: '#92400e',
  white: '#ffffff',
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
