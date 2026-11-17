
// Starts the whole app (real data, real Recharts) in the simulated browser
// and returns helpers for testing the rendered charts and interactions.

import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
import { installDom } from './domEnv.js';

export async function startHomeApp(viewport) {
  const { window, viewport: win } = installDom(viewport);

  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error',
  });

  try {
    const React = await import('react');
    const { act } = React;
    const { createRoot } = await import('react-dom/client');
    const { default: App } = await vite.ssrLoadModule('/src/app/App.jsx');
    const core = await vite.ssrLoadModule('/src/core/index.js');

    const rows = JSON.parse(
      readFileSync('data/superstore.json', 'utf8'),
    ).transactions;

    const root = createRoot(document.getElementById('root'));

    await act(async () => {
      root.render(React.createElement(App));
    });

    const q = (selector) => [...document.querySelectorAll(selector)];

    const tick = (ms = 60) =>
      act(async () => {
        await new Promise((resolve) => setTimeout(resolve, ms));
      });

    const waitFor = async (fn, tries = 160) => {
      for (let i = 0; i < tries; i++) {
        if (fn()) return true;
        await tick(50);
      }

      return false;
    };

    const fire = (target, type, init = {}) =>
      act(async () => {
        if (!target) {
          throw new Error(
            `Cannot dispatch "${type}": target element was not found.`,
          );
        }

        target.dispatchEvent(
          new window.MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            ...init,
          }),
        );
      });

    const pathBounds = (element) => {
      const d = element?.getAttribute('d');

      if (!d) {
        throw new Error('Cannot measure an SVG path without a d attribute.');
      }

      const values = (
        d.match(/-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) || []
      ).map(Number);

      if (values.length < 4 || values.length % 2 !== 0) {
        throw new Error(`Cannot calculate SVG path bounds: ${d}`);
      }

      const xs = [];
      const ys = [];

      for (let i = 0; i < values.length; i += 2) {
        xs.push(values[i]);
        ys.push(values[i + 1]);
      }

      return {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
      };
    };

    const app = {
      window,
      core,
      rows,
      act,
      q,
      tick,
      waitFor,
      viewport: win,
      pathBounds,

      cards: () =>
        q('article').map((article) => {
          const paragraph = article.querySelector('p:nth-of-type(2)');
          return paragraph?.textContent ?? '';
        }),

      cardBy: (label) =>
        document.querySelector(`section[aria-label="${label}"]`),

      // Read labels from rendered SVG text rather than relying on
      // Recharts axis-group class names.
      axisTickLabels: (section, axis = 'x') => {
        const card = app.cardBy(section);

        if (!card) {
          throw new Error(`Chart card "${section}" was not found.`);
        }

        const textElements = [
          ...card.querySelectorAll('svg text'),
        ];

        const labels = textElements
          .map((element) => element.textContent.trim())
          .filter(Boolean);

        if (axis === 'x') {
          const expected =
            section === 'Sales by Category'
              ? ['Furniture', 'Office Supplies', 'Technology']
              : section === 'Regional Performance'
                ? ['West', 'East', 'Central', 'South']
                : [];

          return expected.filter((label) => labels.includes(label));
        }

        if (axis === 'y') {
          return labels.filter((label) =>
            /^-?\$[\d,.]+(?:[KMB])?$/.test(label),
          );
        }

        throw new Error(`Unsupported axis "${axis}".`);
      },

      trendMarkers: () =>
        q('section[aria-label="Monthly Sales Trend"] ellipse').filter(
          (element) => !element.closest('.recharts-active-dot'),
        ),

      bars: () => q('path[data-category]'),

      regionBars: () => q('path[data-region]'),

      slices: () => q('path[data-segment]'),

      sliceLabels: () => q('g[data-label]'),

      combo: (index) => q('[role="combobox"]')[index],

      comboValues: () =>
        q('[role="combobox"]').map((element) => element.textContent),

      click: (element) => fire(element, 'click'),

      pick: async (comboIndex, optionIndex) => {
        const combo = q('[role="combobox"]')[comboIndex];

        await fire(combo, 'click');

        const options = q('[role="option"]');
        await fire(options[optionIndex], 'click');

        await tick();
      },

      press: (key) =>
        act(async () => {
          document.dispatchEvent(
            new window.KeyboardEvent('keydown', {
              key,
              bubbles: true,
            }),
          );
        }),

      hoverChartAt: async (
        x,
        y = 100,
        section = 'Monthly Sales Trend',
      ) => {
        const card = app.cardBy(section);

        if (!card) {
          throw new Error(
            `Cannot hover: chart card "${section}" was not found.`,
          );
        }

        const surface = card.querySelector('.recharts-surface');

        await fire(surface, 'mousemove', {
          clientX: x,
          clientY: y,
        });

        await tick(80);
      },

      clickChartAt: async (
        x,
        y = 100,
        section = 'Monthly Sales Trend',
      ) => {
        await app.hoverChartAt(x, y, section);
        await tick(30);

        const card = app.cardBy(section);
        const surface = card?.querySelector('.recharts-surface');

        await fire(surface, 'click', {
          clientX: x,
          clientY: y,
        });

        await tick();
      },

      hoverBar: async (element) => {
        if (!element) {
          throw new Error('Cannot hover: chart element was not found.');
        }

        await fire(element, 'mouseover');
        await fire(element, 'mousemove');

        await tick(80);
      },

      clickBar: async (element) => {
        if (!element) {
          throw new Error('Cannot click: chart element was not found.');
        }

        await app.hoverBar(element);
        await fire(element, 'click');
        await tick();
      },

      tooltipText: (section = 'Monthly Sales Trend') => {
        const card = app.cardBy(section);

        if (!card) {
          throw new Error(
            `Tooltip chart card "${section}" was not found.`,
          );
        }

        const tooltip = card.querySelector('.recharts-tooltip-wrapper');

        return tooltip?.textContent ?? '';
      },

      resize: (width, height) =>
        act(async () => {
          win.width = width;
          win.height = height;

          window.dispatchEvent(new window.Event('resize'));
        }),

      reset: async () => {
        await app.press('Escape');

        const defaults = [
          'All Regions',
          'All Categories',
          'All Segments',
          'All Years',
        ];

        for (let i = 0; i < defaults.length; i++) {
          if (app.comboValues()[i] !== defaults[i]) {
            await app.pick(i, 0);
          }
        }

        await app.press('Escape');
        await app.tick();
      },

      close: async () => {
        await act(async () => {
          root.unmount();
        });

        await vite.close();
      },
    };

    const rendered = await app.waitFor(
      () =>
        app.trendMarkers().length > 0 &&
        app.bars().length > 0 &&
        app.regionBars().length > 0 &&
        app.slices().length > 0,
    );

    if (!rendered) {
      throw new Error(
        [
          'Home page did not render all expected charts within the timeout.',
          `Trend markers: ${app.trendMarkers().length}`,
          `Category bars: ${app.bars().length}`,
          `Regional bars: ${app.regionBars().length}`,
          `Segment slices: ${app.slices().length}`,
        ].join('\n'),
      );
    }

    return app;
  } catch (error) {
    await vite.close();
    throw error;
  }
}

/** KPI text for a set of filters, calculated independently from raw rows. */
export function expectedKpis(app, filters = {}) {
  const { core, rows } = app;

  const filtered = rows.filter(
    (row) =>
      (!filters.region || row.region === filters.region) &&
      (!filters.category || row.category === filters.category) &&
      (!filters.segment || row.segment === filters.segment) &&
      (!filters.year ||
        row.orderDate.startsWith(String(filters.year))) &&
      (!filters.month ||
        row.orderDate.startsWith(filters.month)),
  );

  const sales = filtered.reduce((total, row) => total + row.sales, 0);
  const profit = filtered.reduce((total, row) => total + row.profit, 0);

  return [
    core.formatCompactCurrency(sales),
    core.formatCompactCurrency(profit),
    core.formatInteger(new Set(filtered.map((row) => row.orderId)).size),
    core.formatInteger(new Set(filtered.map((row) => row.customerId)).size),
  ].join(' | ');
}
