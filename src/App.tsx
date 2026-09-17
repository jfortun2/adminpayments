import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { PaymentsProvider } from "./context/PaymentsContext";
import AdminHomePage from "./pages/AdminHomePage";
import BatchCodesPage from "./pages/BatchCodesPage";
import GlobalPaymentsPage from "./pages/GlobalPaymentsPage";
import TemplateOverviewPage from "./pages/TemplateOverviewPage";
import TemplatePaymentsPage from "./pages/TemplatePaymentsPage";

export default function App() {
  return (
    <PaymentsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AdminHomePage />} />
          <Route path="/payments" element={<GlobalPaymentsPage />} />
          <Route path="/payments/batches/:batchId" element={<BatchCodesPage />} />
          <Route path="/templates" element={<Navigate to="/templates/intro-to-gardening" replace />} />
          <Route path="/templates/:templateId" element={<TemplateOverviewPage />} />
          <Route path="/templates/:templateId/payments" element={<TemplatePaymentsPage />} />
          <Route
            path="/templates/:templateId/payments/batches/:batchId"
            element={<BatchCodesPage />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </PaymentsProvider>
  );
}
