import { groupBy, sumBy } from './aggregations.js';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const YEARS = [2014, 2015, 2016, 2017];

export function buildProfitabilityTrendSeries(rows) {
  const grouped = groupBy(
    rows,
    (row) => row.orderDate.slice(0, 7),
  );

  return MONTH_NAMES.map((monthName, index) => {
    const month = String(index + 1).padStart(2, '0');

    const result = {
      month: monthName,
      monthNumber: index + 1,
    };

    YEARS.forEach((year) => {
      const monthKey = `${year}-${month}`;
      const monthRows = grouped.get(monthKey) ?? [];

      result[`profit${year}`] = sumBy(monthRows, 'profit');
      result[`monthKey${year}`] = monthKey;
    });

    return result;
  });
}