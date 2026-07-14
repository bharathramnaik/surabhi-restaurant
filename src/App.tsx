import { Suspense } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import LocaleWrapper from "./components/providers/locale-wrapper.tsx";
import { SAVED_OR_DEFAULT_LOCALE, setLocaleInPath } from "./i18n.ts";
import "./i18n.ts";
import { useServiceWorker } from "./hooks/use-service-worker.ts";
import AuthCallback from "./pages/auth/Callback.tsx";
import AppLayout from "./pages/_components/app-layout.tsx";
import Dashboard from "./pages/dashboard/page.tsx";
import MenuPage from "./pages/menu/page.tsx";
import TablesPage from "./pages/tables/page.tsx";
import OrdersPage from "./pages/orders/page.tsx";
import InventoryPage from "./pages/inventory/page.tsx";
import EmployeesPage from "./pages/employees/page.tsx";
import ReportsPage from "./pages/reports/page.tsx";
import NotFound from "./pages/NotFound.tsx";

function AppWithSW() {
  useServiceWorker();
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <Routes>
        <Route path="/" element={<Navigate to={setLocaleInPath(SAVED_OR_DEFAULT_LOCALE, "/")} replace />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/:lng" element={<LocaleWrapper><Outlet /></LocaleWrapper>}>
          <Route element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="tables" element={<TablesPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <AppWithSW />
      </BrowserRouter>
    </DefaultProviders>
  );
}
