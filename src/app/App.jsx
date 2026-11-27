
import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import AppShell from '../ui/layout/AppShell.jsx';
import PageSpinner from '../ui/layout/PageSpinner.jsx';

const HomePage = lazy(() => import('../pages/home/HomePage.jsx'));
const SalesAnalysisPage = lazy(() => import('../pages/sales/SalesAnalysisPage.jsx'));
const RegionalAnalysisPage = lazy(() => import('../pages/regional/RegionalAnalysisPage.jsx'));
const ProductAnalysisPage = lazy(() => import('../pages/product/ProductAnalysisPage.jsx'));
const CustomerAnalysisPage = lazy(() => import('../pages/customer/CustomerAnalysisPage.jsx'));
const ProfitabilityAnalysisPage = lazy(() => import('../pages/profitability/ProfitabilityAnalysisPage.jsx'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage.jsx'));

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route
            index
            element={
              <Suspense fallback={<PageSpinner />}>
                <HomePage />
              </Suspense>
            }
          />

          <Route
            path="sales"
            element={
              <Suspense fallback={<PageSpinner />}>
                <SalesAnalysisPage />
              </Suspense>
            }
          />

          <Route
            path="regional"
            element={
              <Suspense fallback={<PageSpinner />}>
                <RegionalAnalysisPage />
              </Suspense>
            }
          />

          <Route
            path="product"
            element={
              <Suspense fallback={<PageSpinner />}>
                <ProductAnalysisPage />
              </Suspense>
            }
          />

          <Route
            path="customers"
            element={
              <Suspense fallback={<PageSpinner />}>
                <CustomerAnalysisPage />
              </Suspense>
            }
          />

          <Route
            path="profitability"
            element={
              <Suspense fallback={<PageSpinner />}>
                <ProfitabilityAnalysisPage />
              </Suspense>
            }
          />

          <Route
            path="*"
            element={
              <Suspense fallback={<PageSpinner />}>
                <NotFoundPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </HashRouter>
  );
}
