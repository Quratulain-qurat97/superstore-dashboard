
import { groupBy, sumBy } from './aggregations.js';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function buildSalesTrendSeries(rows, selectedYear = 2017) {
  const currentYear = Number(selectedYear) || 2017;
  const previousYear = currentYear - 1;

  const hasPreviousYear = currentYear > 2014;

  const yearRows = rows.filter((row) => {
    const year = Number(row.orderDate.slice(0, 4));

    return (
      year === currentYear ||
      (hasPreviousYear && year === previousYear)
    );
  });

  const grouped = groupBy(
    yearRows,
    (row) => row.orderDate.slice(0, 7),
  );

  return MONTH_NAMES.map((monthName, index) => {
    const month = String(index + 1).padStart(2, '0');

    const currentMonthKey = `${currentYear}-${month}`;
    const previousMonthKey = `${previousYear}-${month}`;

    const currentRows =
      grouped.get(currentMonthKey) ?? [];

    const previousRows = hasPreviousYear
      ? grouped.get(previousMonthKey) ?? []
      : [];

    const sales = sumBy(currentRows, 'sales');
    const previousSales = hasPreviousYear
      ? sumBy(previousRows, 'sales')
      : null;

    return {
      month: monthName,
      monthNumber: index + 1,

      // Explicit identifiers for independent point selection.
      currentMonthKey,
      previousMonthKey: hasPreviousYear
        ? previousMonthKey
        : null,

      sales,
      previousSales,

      difference:
        hasPreviousYear ? sales - previousSales : null,

      percentageChange:
        !hasPreviousYear || previousSales === 0
          ? null
          : ((sales - previousSales) / previousSales) * 100,
    };
  });
}
