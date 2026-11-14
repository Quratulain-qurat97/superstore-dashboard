// chartScale.js
// "Nice" axis scales for charts, so tick labels are round numbers ($50K, $100K ...).

const NICE_MULTIPLIERS = [1, 2, 2.5, 5, 10];
const clean = (n) => Number(n.toPrecision(12)); // removes floating-point noise (0.30000000000000004)

/**
 * Axis from 0 up to a round maximum, split into `intervals` equal steps (so intervals + 1 ticks).
 * The largest value always fits: max >= maxValue.
 * @returns {{ step:number, max:number, ticks:number[] }}
 */
export function niceAxis(maxValue, intervals = 4) {
  const value = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : 0;
  if (value === 0) {
    return { step: 1, max: intervals, ticks: Array.from({ length: intervals + 1 }, (_, i) => i) };
  }
  const rawStep = value / intervals;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = clean(NICE_MULTIPLIERS.map((m) => m * magnitude).find((candidate) => candidate >= rawStep * (1 - 1e-9)));
  return {
    step,
    max: clean(step * intervals),
    ticks: Array.from({ length: intervals + 1 }, (_, i) => clean(step * i)),
  };
}

/**
 * Like niceAxis, but the lowest value may be negative (e.g. a loss). With no negative values it is
 * exactly niceAxis (zero at the bottom, `intervals` steps up to a round maximum). With negative values
 * the axis extends below zero by whole steps, so zero is always a tick and bars start from the zero line.
 * @returns {{ step:number, min:number, max:number, ticks:number[] }}  min <= 0 <= max, max >= maxValue, min <= minValue
 */
export function niceAxisRange(minValue, maxValue, intervals = 5) {
  if (!Number.isFinite(minValue) || minValue >= 0) {
    return { ...niceAxis(maxValue, intervals), min: 0 };
  }
  const max = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : 0;
  const rawStep = (max - minValue) / intervals;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = clean(NICE_MULTIPLIERS.map((m) => m * magnitude).find((candidate) => candidate >= rawStep * (1 - 1e-9)));
  const low = clean(Math.floor(minValue / step) * step);
  const high = max === 0 ? 0 : clean(Math.ceil(max / step) * step);
  const count = Math.round((high - low) / step);
  return { step, min: low, max: high, ticks: Array.from({ length: count + 1 }, (_, i) => clean(low + step * i)) };
}
