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
