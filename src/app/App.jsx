
import { HashRouter, Route, Routes } from 'react-router-dom';

import AppShell from '../ui/layout/AppShell.jsx';

import HomePage from '../pages/home/HomePage.jsx';
import SalesAnalysisPage from '../pages/sales/SalesAnalysisPage.jsx';
import RegionalAnalysisPage from '../pages/regional/RegionalAnalysisPage.jsx';
import ProductAnalysisPage from '../pages/product/ProductAnalysisPage.jsx';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="sales" element={<SalesAnalysisPage />} />
          <Route path="regional" element={<RegionalAnalysisPage />} />
          <Route path="product" element={<ProductAnalysisPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
