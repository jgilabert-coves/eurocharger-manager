export type FormatNumberOptions = {
  decimals?: number;
  decimalSeparator?: string;
  thousandSeparator?: string;
  prefix?: string;
  suffix?: string;
};

export function formatNumber(value: number, options?: FormatNumberOptions): string {
  const {
    decimals = 0,
    decimalSeparator = ',',
    thousandSeparator = '.',
    prefix = '',
    suffix = '',
  } = options || {};

  const nonDecimalNumber = Math.floor(value);
  const decimalPart = (value - nonDecimalNumber).toFixed(decimals).slice(2);

  const formattedNumber = nonDecimalNumber
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
  return `${prefix}${formattedNumber}${decimalPart ? decimalSeparator + decimalPart : ''}${suffix}`;
}

// ----------------------------------------------------------------------
// Formato español de moneda: 1.000,00 € (separador de miles '.', decimal
// ',', espacio antes de '€'). Basado en Intl.NumberFormat para un redondeo
// correcto. `unit` es un sufijo por-unidad opcional, p. ej. '/mes'.

export function formatEuros(
  value: number | null | undefined,
  opts?: { decimals?: number; unit?: string }
): string {
  const { decimals = 2, unit = '' } = opts ?? {};
  if (value == null || Number.isNaN(value)) return '—';
  const s = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    // 'es-ES' no agrupa números de 4 dígitos por defecto (minimumGroupingDigits: 2);
    // forzamos el separador de miles siempre → 1.000,00 €.
    useGrouping: true,
  }).format(value);
  return unit ? `${s}${unit}` : s;
}

// Igual que formatEuros pero el valor de entrada está en céntimos.
export function formatCents(
  value: number | null | undefined,
  opts?: { decimals?: number; unit?: string }
): string {
  if (value == null || Number.isNaN(value)) return '—';
  return formatEuros(value / 100, opts);
}

// Número en formato español sin símbolo '€' (rangos de tarifa, número + unidad
// como texto aparte).
export function formatDecimal(
  value: number | null | undefined,
  opts?: { decimals?: number }
): string {
  const { decimals = 2 } = opts ?? {};
  if (value == null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  }).format(value);
}
