import { tk, fmtN, fmtEur, fmtT } from './tokens';

export const PERIODS = ['Semana', 'Mes', 'Año', 'Periodo'] as const;
export type Period = (typeof PERIODS)[number];

export type StatItem = {
  label: string;
  v: string;
  delta: string;
  line: number[];
  lineColor: string;
  fmt: (v: number | string) => string;
  dayVals: (number | string)[];
};

export type PeriodData = {
  labels: string[];
  data: StatItem[];
};

export const STATS_BY_PERIOD: Record<string, PeriodData> = {
  Día: {
    labels: ['00', '', '02', '', '04', '', '06', '', '08', '', '10', '', '12', '', '14', '', '16', '', '18', '', '20', '', '22', ''],
    data: [
      { label: 'Usuarios', v: '847', delta: '▲ 3.1%', line: [2, 2, 2, 2, 3, 4, 6, 9, 14, 18, 22, 26, 28, 27, 26, 24, 22, 20, 18, 16, 12, 8, 5, 3], lineColor: tk.yellowBase, fmt: fmtN, dayVals: [8, 10, 12, 14, 20, 35, 55, 80, 140, 210, 320, 440, 520, 510, 490, 460, 420, 380, 330, 280, 210, 140, 80, 40] },
      { label: 'Recargas', v: '71', delta: '▲ 2.2%', line: [1, 1, 1, 1, 2, 3, 4, 6, 10, 14, 18, 22, 24, 23, 22, 20, 18, 16, 14, 12, 8, 5, 3, 2], lineColor: tk.green, fmt: fmtN, dayVals: [1, 1, 1, 1, 2, 3, 4, 6, 8, 11, 15, 19, 22, 21, 20, 18, 16, 14, 12, 10, 7, 4, 2, 1] },
      { label: 'Ingresos', v: '1.641', delta: '▼ 8%', line: [2, 2, 2, 2, 3, 5, 7, 10, 16, 20, 26, 30, 32, 31, 28, 26, 24, 22, 20, 17, 13, 9, 5, 3], lineColor: tk.redBase, fmt: fmtEur, dayVals: [20, 22, 25, 28, 40, 65, 90, 130, 190, 270, 370, 460, 530, 520, 500, 470, 430, 390, 340, 290, 220, 150, 90, 50] },
      { label: 'Tiempo medio', v: '01:42', delta: '▼ 5%', line: [6, 6, 7, 7, 8, 10, 12, 16, 20, 22, 24, 26, 28, 27, 26, 25, 24, 23, 22, 20, 18, 15, 12, 9], lineColor: tk.blueBase, fmt: fmtT, dayVals: ['00:42', '00:44', '00:48', '00:50', '00:55', '01:05', '01:12', '01:22', '01:30', '01:35', '01:40', '01:44', '01:52', '01:50', '01:48', '01:46', '01:44', '01:42', '01:40', '01:38', '01:35', '01:28', '01:18', '01:05'] },
    ],
  },
  Semana: {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    data: [
      { label: 'Usuarios', v: '12.293', delta: '→ 0%', line: [18, 20, 19, 22, 21, 24, 22], lineColor: tk.yellowBase, fmt: fmtN, dayVals: [11240, 11580, 11920, 12010, 12100, 12180, 12293] },
      { label: 'Recargas', v: '1.293', delta: '▲ 2.2%', line: [14, 18, 22, 20, 26, 24, 28], lineColor: tk.green, fmt: fmtN, dayVals: [1100, 1150, 1180, 1210, 1240, 1270, 1293] },
      { label: 'Ingresos', v: '1.641', delta: '▼ 8%', line: [32, 30, 28, 26, 24, 22, 18], lineColor: tk.redBase, fmt: fmtEur, dayVals: [2100, 2050, 1980, 1900, 1850, 1720, 1641] },
      { label: 'Tiempo medio', v: '01:42', delta: '▼ 5%', line: [16, 18, 20, 22, 24, 22, 26], lineColor: tk.blueBase, fmt: fmtT, dayVals: ['01:20', '01:28', '01:35', '01:38', '01:40', '01:41', '01:42'] },
    ],
  },
  Mes: {
    labels: ['S1', 'S2', 'S3', 'S4'],
    data: [
      { label: 'Usuarios', v: '48.720', delta: '▲ 5.4%', line: [14, 18, 24, 28], lineColor: tk.yellowBase, fmt: fmtN, dayVals: [38200, 42500, 45800, 48720] },
      { label: 'Recargas', v: '5.840', delta: '▲ 7.1%', line: [12, 16, 22, 30], lineColor: tk.green, fmt: fmtN, dayVals: [4200, 4800, 5300, 5840] },
      { label: 'Ingresos', v: '24.310', delta: '▲ 4.2%', line: [16, 20, 24, 28], lineColor: tk.redBase, fmt: fmtEur, dayVals: [18900, 21200, 23100, 24310] },
      { label: 'Tiempo medio', v: '01:38', delta: '▲ 2.1%', line: [18, 20, 22, 20], lineColor: tk.blueBase, fmt: fmtT, dayVals: ['01:30', '01:35', '01:40', '01:38'] },
    ],
  },
  Año: {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    data: [
      { label: 'Usuarios', v: '312.480', delta: '▲ 18.3%', line: [8, 10, 12, 14, 16, 18, 20, 21, 22, 24, 25, 26], lineColor: tk.yellowBase, fmt: fmtN, dayVals: [198000, 210000, 222000, 235000, 248000, 262000, 272000, 280000, 288000, 297000, 305000, 312480] },
      { label: 'Recargas', v: '68.420', delta: '▲ 22.5%', line: [6, 8, 10, 13, 16, 18, 21, 23, 25, 27, 29, 30], lineColor: tk.green, fmt: fmtN, dayVals: [38000, 41000, 44500, 48000, 52000, 55500, 58500, 61000, 63500, 65500, 67000, 68420] },
      { label: 'Ingresos', v: '284.900', delta: '▲ 15.7%', line: [9, 11, 13, 15, 17, 19, 21, 23, 24, 25, 26, 28], lineColor: tk.redBase, fmt: fmtEur, dayVals: [185000, 197000, 210000, 222000, 234000, 245000, 255000, 263000, 269000, 274000, 280000, 284900] },
      { label: 'Tiempo medio', v: '01:45', delta: '▼ 1.2%', line: [24, 22, 22, 20, 20, 18, 20, 20, 18, 18, 20, 20], lineColor: tk.blueBase, fmt: fmtT, dayVals: ['01:52', '01:48', '01:48', '01:44', '01:44', '01:40', '01:44', '01:44', '01:40', '01:40', '01:44', '01:45'] },
    ],
  },
};

export const EMPTY_PERIOD: PeriodData = {
  labels: ['—', '—', '—', '—', '—', '—', '—'],
  data: [
    { label: 'Usuarios', v: '—', delta: '→ 0%', line: [18, 18, 18, 18, 18, 18, 18], lineColor: tk.yellowBase, fmt: fmtT, dayVals: ['—', '—', '—', '—', '—', '—', '—'] },
    { label: 'Recargas', v: '—', delta: '→ 0%', line: [18, 18, 18, 18, 18, 18, 18], lineColor: tk.green, fmt: fmtT, dayVals: ['—', '—', '—', '—', '—', '—', '—'] },
    { label: 'Ingresos', v: '—', delta: '→ 0%', line: [18, 18, 18, 18, 18, 18, 18], lineColor: tk.redBase, fmt: fmtT, dayVals: ['—', '—', '—', '—', '—', '—', '—'] },
    { label: 'Tiempo medio', v: '—', delta: '→ 0%', line: [18, 18, 18, 18, 18, 18, 18], lineColor: tk.blueBase, fmt: fmtT, dayVals: ['—', '—', '—', '—', '—', '—', '—'] },
  ],
};

export function getCustomPeriodData(from: string, to: string): PeriodData | null {
  if (!from || !to) return null;
  const d1 = new Date(from);
  const d2 = new Date(to);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime()) || d2 < d1) return null;
  const diff = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
  if (diff === 0) return STATS_BY_PERIOD['Día'];
  if (diff < 7) return { labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].slice(0, Math.ceil(diff) + 1), data: STATS_BY_PERIOD['Semana'].data };
  if (diff < 30) return { labels: ['S1', 'S2', 'S3', 'S4'].slice(0, Math.ceil(diff / 7) + 1), data: STATS_BY_PERIOD['Mes'].data };
  if (diff < 365) return { labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].slice(0, Math.ceil(diff / 30) + 1), data: STATS_BY_PERIOD['Año'].data };
  const n = Math.min(Math.ceil(diff / 365) + 1, 6);
  return { labels: Array.from({ length: n }, (_, i) => `${2021 + i}`), data: STATS_BY_PERIOD['Año'].data };
}

export const CHARGER_STATES = [
  { l: 'Disponibles', v: 7, c: tk.green, bg: tk.greenLightest },
  { l: 'Ocupados', v: 2, c: tk.blueBase, bg: tk.blueLightest },
  { l: 'Reservados', v: 3, c: tk.yellowBase, bg: tk.yellowLightest },
  { l: 'Averiados', v: 0, c: tk.redBase, bg: tk.redLightest },
  { l: 'Sin conexión', v: 1, c: tk.skyDark, bg: tk.skyLighter },
];

export const CONECTORES = [
  { label: 'Total', iconKey: 'total' as const, avail: '97%', avDelta: '+0.2%', avUp: true as boolean | null, occ: '137', ocDelta: '+0.2%', ocUp: true as boolean | null },
  { label: 'Mennekes', iconKey: 'mennekes' as const, avail: '98%', avDelta: '+1.2%', avUp: true as boolean | null, occ: '64', ocDelta: '+1.2%', ocUp: true as boolean | null },
  { label: 'CCS', iconKey: 'ccs' as const, avail: '96%', avDelta: '-0.1%', avUp: false as boolean | null, occ: '25', ocDelta: '-0.1%', ocUp: false as boolean | null },
  { label: 'CHAdeMo', iconKey: 'chademo' as const, avail: '0', avDelta: '→ 0%', avUp: null as boolean | null, occ: '0', ocDelta: '→ 0%', ocUp: null as boolean | null },
  { label: 'Otros', iconKey: 'schuko' as const, avail: '0', avDelta: '→ 0%', avUp: null as boolean | null, occ: '0', ocDelta: '→ 0%', ocUp: null as boolean | null },
];

export const CONN_TYPES = [
  { label: 'AC', total: 89, inUse: 34, c: tk.green, bg: tk.greenLightest, desc: 'Corriente alterna' },
  { label: 'DC', total: 48, inUse: 21, c: tk.blueBase, bg: tk.blueLightest, desc: 'Corriente continua' },
];

export const TOP_CLIENTS = [
  { name: 'Jonay Gilabert', recargas: 12, euros: '94,17' },
  { name: 'Pablo Melón', recargas: 12, euros: '94,12' },
  { name: 'Alejandro Martínez', recargas: 12, euros: '94,12' },
  { name: 'Kike Escalante', recargas: 12, euros: '94,12' },
];

export const TOP_CHARGERS = [
  { name: 'Parque Majuelo 2', recargas: 125, euros: '214,40' },
  { name: 'Ayto. Pedreguer', recargas: 125, euros: '214,40' },
  { name: 'Universidad Málaga 2', recargas: 125, euros: '714,40' },
  { name: 'Copinsa Oficina', recargas: 125, euros: '214,40' },
];

export const IN_USE = [
  { id: 'EUR*2134', name: 'Campus Medicina 1', city: 'Málaga', conn: '1/2', full: false },
  { id: 'EUR*2111', name: 'Campus Medicina 2', city: 'Sevilla', conn: '2/2', full: true },
  { id: 'EUR*9814', name: 'Campus Medicina 3', city: 'Valencia', conn: '1/3', full: false },
  { id: 'EUR*1851', name: 'Campus Medicina 4', city: 'Málaga', conn: '1/1', full: true },
];

export const TRANSACTIONS = [
  { id: 'EUR*2134', user: 'Alejandro Martínez', city: 'Málaga' },
  { id: 'EUR*2111', user: 'Jonay Gilabert', city: 'Sevilla' },
  { id: 'EUR*9814', user: 'Kike Escalante', city: 'Valencia' },
  { id: 'EUR*1851', user: 'Jonay Gilabert', city: 'Málaga' },
];

export const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const HOURS = ['08h', '10h', '12h', '14h', '16h', '18h', '20h'];
export const HEATMAP = [
  [2, 3, 4, 5, 4, 2, 1],
  [3, 5, 8, 9, 7, 3, 2],
  [5, 8, 12, 15, 11, 6, 4],
  [6, 10, 14, 18, 13, 7, 5],
  [5, 9, 12, 16, 12, 6, 4],
  [3, 6, 9, 11, 8, 4, 3],
  [2, 4, 6, 8, 6, 3, 2],
];

export const MANT = [
  { label: 'Alarmas', v: 2, delta: '+0.2%', up: true as boolean | undefined },
  { label: 'Averías', v: 3, delta: '+1.2%', up: true as boolean | undefined },
  { label: 'Consultas', v: 41, delta: '-0.1%', up: false as boolean | undefined },
  { label: 'Sugerencias', v: 13, delta: '→ 0%', up: undefined as boolean | undefined },
];

export const SPARK_A = 'M0,30 C15,26 30,16 45,18 C60,20 72,10 90,5';
export const SPARK_B = 'M0,28 C15,24 28,20 45,22 C60,24 72,13 90,7';
