// formatters.js
// Turn numbers into display text. Rounding happens here and nowhere else.
// Written without Intl so it behaves the same in a browser, Electron, Tauri or React Native.

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const withCommas = (digits) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** 5009 -> "5,009" */
export function formatInteger(value) {
  if (!Number.isFinite(value)) return '—';
  return (value < 0 ? '-' : '') + withCommas(String(Math.round(Math.abs(value))));
}

/**
 * Rounds a non-negative money amount to `decimals` places and returns it as a whole number of
 * 10^-decimals units (e.g. 1161401.345 -> 116140135 cents).
 *
 * The transaction data has at most 4 decimals, so a sum is a whole number of ten-thousandths. A
 * floating-point sum carries tiny noise (1161401.3449999999 for 1161401.3450), which made the plain
 * `toFixed(2)` round some half-cents DOWN. Here the exact 4-decimal value is recovered first and then
 * rounded half away from zero, the same way MySQL's ROUND() rounds DECIMAL values.
 */
function roundMoney(abs, decimals) {
  const units = Math.round(abs * 10000);
  const isExactTenThousandths = Math.abs(abs * 10000 - units) < 1e-3;
  if (isExactTenThousandths && decimals >= 0 && decimals <= 4) {
    const divisor = 10 ** (4 - decimals);
    return Math.floor((units + divisor / 2) / divisor);
  }
  return Math.round(Number(abs.toFixed(decimals)) * 10 ** decimals); // averages and other non-money values
}

/** Exact currency: 2297200.86 -> "$2,297,200.86" (used in tooltips). Money rounds half away from zero. */
export function formatCurrency(value, decimals = 2) {
  if (!Number.isFinite(value)) return '—';
  const scaled = roundMoney(Math.abs(value), decimals);
  const factor = 10 ** decimals;
  const whole = Math.floor(scaled / factor);
  const fraction = decimals > 0 ? `.${String(scaled % factor).padStart(decimals, '0')}` : '';
  return `${value < 0 && scaled !== 0 ? '-' : ''}$${withCommas(String(whole))}${fraction}`;
}

/** Compact currency: 2297200.86 -> "$2.30M", 286397.02 -> "$286.4K", 412 -> "$412" */
export function formatCompactCurrency(value) {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6 || Number((abs / 1e3).toFixed(1)) >= 1000) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3 || Math.round(abs) >= 1000) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  const whole = Math.round(abs);
  return `${whole === 0 ? '' : sign}$${whole}`;
}

/** 12.4678 -> "12.5%". null (no sales) -> "—" */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${value.toFixed(decimals)}%`;
}

/** Share of a total, as a percent number (or null when the total is 0). */
export const percentOf = (part, total) => (total === 0 ? null : (part / total) * 100);

/** '2016-03' -> "March 2016" */
export function formatMonthLong(month) {
  const [year, m] = month.split('-');
  return `${MONTH_NAMES[Number(m) - 1]} ${year}`;
}

/** '2016-03' -> "Mar 2016" */
export function formatMonthShort(month) {
  const [year, m] = month.split('-');
  return `${MONTH_NAMES[Number(m) - 1].slice(0, 3)} ${year}`;
}

// ---- chart axis and tooltip helpers -------------------------------------------------------------

const trimmed = (n, decimals) => String(Number(n.toFixed(decimals)));

/** Axis labels without trailing zeros: 0 -> "$0", 50000 -> "$50K", 2500 -> "$2.5K", 1500000 -> "$1.5M" */
export function formatAxisCurrency(value) {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}$${trimmed(abs / 1e9, 2)}B`;
  if (abs >= 1e6) return `${sign}$${trimmed(abs / 1e6, 2)}M`;
  if (abs >= 1e3) return `${sign}$${trimmed(abs / 1e3, 2)}K`;
  return `${sign}$${trimmed(abs, 2)}`;
}

/** +$3,210.00 / -$1,234.00 / $0.00 (for "change versus previous month") */
export function formatSignedCurrency(value, decimals = 2) {
  if (!Number.isFinite(value)) return '—';
  const text = formatCurrency(Math.abs(value), decimals);
  if (Number(Math.abs(value).toFixed(decimals)) === 0) return text;
  return `${value > 0 ? '+' : '-'}${text}`;
}

/** +35.9% / -12.3% / 0.0% */
export function formatSignedPercent(value, decimals = 1) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const text = `${Math.abs(value).toFixed(decimals)}%`;
  if (Number(Math.abs(value).toFixed(decimals)) === 0) return text;
  return `${value > 0 ? '+' : '-'}${text}`;
}

/** Returns true when a finite numeric value is negative. */
export function isNegativeValue(value) {
  return Number.isFinite(value) && value < 0;
}