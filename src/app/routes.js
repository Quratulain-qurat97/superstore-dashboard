// routes.js
// The six planned pages, in navigation order. Only Home exists so far.
// To add a page later: create it under src/pages/, register it in App.jsx, set enabled: true.
//
// `glyph` says which icon the navigation button shows (see ui/layout/SideNav.jsx).
export const NAV_ITEMS = [
  { id: 'home', label: 'Home', path: '/', enabled: true, glyph: 'home' },
  { id: 'sales', label: 'Sales Analysis', path: '/sales', enabled: true, glyph: 'book-open' },
  { id: 'regional', label: 'Regional Analysis', path: '/regional', enabled: false, glyph: 'globe' },
  { id: 'product', label: 'Product Analysis', path: '/product', enabled: false, glyph: 'clipboard-list' },
  { id: 'customer', label: 'Customer Analysis', path: '/customers', enabled: false, glyph: 'users' },
  { id: 'profitability', label: 'Profitability Analysis', path: '/profitability', enabled: false, glyph: 'trending-up' },
];
