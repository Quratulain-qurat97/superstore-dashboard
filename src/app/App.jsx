
import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import AppShell from '../ui/layout/AppShell.jsx';

const HomePage = lazy(() => import('../pages/home/HomePage.jsx'));
const SalesAnalysisPage = lazy(() => import('../pages/sales/SalesAnalysisPage.jsx'));
const RegionalAnalysisPage = lazy(() => import('../pages/regional/RegionalAnalysisPage.jsx'));
const ProductAnalysisPage = lazy(() => import('../pages/product/ProductAnalysisPage.jsx'));
const CustomerAnalysisPage = lazy(() => import('../pages/customer/CustomerAnalysisPage.jsx'));
const ProfitabilityAnalysisPage = lazy(() => import('../pages/profitability/ProfitabilityAnalysisPage.jsx'));

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route
            index
            element={
              <Suspense fallback={null}>
                <HomePage />
              </Suspense>
            }
          />
          <Route
            path="sales"
            element={
              <Suspense fallback={null}>
                <SalesAnalysisPage />
              </Suspense>
            }
          />
          <Route
            path="regional"
            element={
              <Suspense fallback={null}>
                <RegionalAnalysisPage />
              </Suspense>
            }
          />
          <Route
            path="product"
            element={
              <Suspense fallback={null}>
                <ProductAnalysisPage />
              </Suspense>
            }
          />
          <Route
            path="customers"
            element={
              <Suspense fallback={null}>
                <CustomerAnalysisPage />
              </Suspense>
            }
          />
          <Route
            path="profitability"
            element={
              <Suspense fallback={null}>
                <ProfitabilityAnalysisPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </HashRouter>
  );
}
