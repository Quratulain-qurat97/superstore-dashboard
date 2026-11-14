// Starts the whole app (real data, real Recharts) in the simulated browser and returns test helpers.
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
import { installDom } from './domEnv.js';

export async function startHomeApp(viewport) {
  const { window, viewport: win } = installDom(viewport);
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
  const React = await import('react');
  const { act } = React;
  const { createRoot } = await import('react-dom/client');
  const { default: App } = await vite.ssrLoadModule('/src/app/App.jsx');
  const core = await vite.ssrLoadModule('/src/core/index.js');
  const rows = JSON.parse(readFileSync('data/superstore.json', 'utf8')).transactions;
  const root = createRoot(document.getElementById('root'));
  await act(async () => { root.render(React.createElement(App)); });

  const q = (selector) => [...document.querySelectorAll(selector)];
  const tick = (ms = 60) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });
  const waitFor = async (fn, tries = 160) => { for (let i = 0; i < tries; i++) { if (fn()) return true; await tick(50); } return false; };
  const fire = (target, type, init = {}) => act(async () => { target.dispatchEvent(new window.MouseEvent(type, { bubbles: true, cancelable: true, ...init })); });

  const app = {
    window, core, rows, act, q, tick, waitFor, viewport: win,
    cards: () => q('article').map((a) => a.querySelector('p:nth-of-type(2)').textContent),
    cardBy: (label) => document.querySelector(`section[aria-label="${label}"]`),
    callout: (label) => document.querySelector(`section[aria-label="${label}"] p`).textContent,
    trendMarkers: () => q('section[aria-label="Monthly Sales Trend"] ellipse').filter((e) => !e.closest('.recharts-active-dot')),
    bars: () => q('rect[data-category]'),
    regionBars: () => q('rect[data-region]'),
    slices: () => q('g[data-segment]'),
    sliceLabels: () => q('g[data-label]'),
    combo: (i) => q('[role="combobox"]')[i],
    comboValues: () => q('[role="combobox"]').map((c) => c.textContent),
    click: (el) => fire(el, 'click'),
    pick: async (comboIndex, optionIndex) => { await fire(q('[role="combobox"]')[comboIndex], 'click'); await fire(q('[role="option"]')[optionIndex], 'click'); await tick(); },
    press: (key) => act(async () => { document.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true })); }),
    // the real mouse always moves before it clicks, and Recharts handles the move one frame later
    hoverChartAt: async (x, y = 100, section = 'Monthly Sales Trend') => { await fire(app.cardBy(section).querySelector('.recharts-wrapper'), 'mousemove', { clientX: x, clientY: y }); await tick(60); },
    clickChartAt: async (x, y = 100, section = 'Monthly Sales Trend') => { await app.hoverChartAt(x, y, section); await tick(30); await fire(app.cardBy(section).querySelector('.recharts-wrapper'), 'click', { clientX: x, clientY: y }); await tick(); },
    hoverBar: async (el) => { await fire(el, 'mouseover'); await tick(80); },
    clickBar: async (el) => { await fire(el, 'mouseover'); await tick(40); await fire(el, 'click'); await tick(); },
    tooltipText: (section = 'Monthly Sales Trend') => { const t = app.cardBy(section).querySelector('.recharts-tooltip-wrapper'); return t ? t.textContent : ''; },
    resize: (w, h) => act(async () => { win.width = w; win.height = h; window.dispatchEvent(new window.Event('resize')); }),
    // reset every filter and selection to the initial state
    reset: async () => {
      await app.press('Escape');
      for (let i = 0; i < 4; i++) { if (app.comboValues()[i] !== ['All Regions', 'All Categories', 'All Segments', 'All Years'][i]) await app.pick(i, 0); }
      await app.press('Escape'); await app.tick();
    },
    close: async () => { await act(async () => root.unmount()); await vite.close(); },
  };
  await app.waitFor(() => app.trendMarkers().length > 0 && app.bars().length > 0);
  return app;
}

/** KPI text for a set of filters, calculated independently from the raw rows. */
export function expectedKpis(app, f) {
  const { core, rows } = app;
  const r = rows.filter((x) => (!f.region || x.region === f.region) && (!f.category || x.category === f.category) && (!f.segment || x.segment === f.segment) && (!f.year || x.orderDate.startsWith(String(f.year))) && (!f.month || x.orderDate.startsWith(f.month)));
  const sales = r.reduce((t, x) => t + x.sales, 0);
  const profit = r.reduce((t, x) => t + x.profit, 0);
  return [core.formatCompactCurrency(sales), core.formatCompactCurrency(profit), core.formatInteger(new Set(r.map((x) => x.orderId)).size), core.formatInteger(new Set(r.map((x) => x.customerId)).size)].join(' | ');
}
