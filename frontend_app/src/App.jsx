import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import AnomaliesPage from "./pages/AnomaliesPage";
import VariantDetailsPage from "./pages/VariantDetailsPage";
import ProductsPage from "./pages/ProductsPage";
import VariantsPage from "./pages/VariantsPage";
import LowStockPage from "./pages/LowStockPage";
import NotificationsPage from "./pages/NotificationsPage";
import ReplenishmentPage from "./pages/ReplenishmentPage";
import ReplenishmentListPage from "./pages/ReplenishmentListPage";
import OperationsPage from "./pages/OperationsPage";
import SalesReportPage from "./pages/SalesReportPage";
import ReceiptPage from "./pages/ReceiptPage";
import OperationsLogPage from "./pages/OperationsLogPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/variants-list" element={<VariantsPage />} />
        <Route path="/low-stock" element={<LowStockPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
        <Route path="/anomalies" element={<AnomaliesPage />} />
        <Route path="/variants/:variantId" element={<VariantDetailsPage />} />
        <Route path="/replenishment" element={<ReplenishmentPage />} />
        <Route path="/replenishment-list" element={<ReplenishmentListPage />} />
        <Route path="/operations" element={<OperationsPage />} />
        <Route path="/sales-report" element={<SalesReportPage />} />
        <Route path="/receipt" element={<ReceiptPage />} />
        <Route path="/operations-log" element={<OperationsLogPage />} />
      </Routes>
    </BrowserRouter>
  );
}