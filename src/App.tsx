import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { PaymentsProvider } from "./context/PaymentsContext";
import BatchCodesPage from "./pages/BatchCodesPage";
import TemplateOverviewPage from "./pages/TemplateOverviewPage";
import TemplatePaymentsPage from "./pages/TemplatePaymentsPage";

export default function App() {
  return (
    <PaymentsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<TemplateOverviewPage />} />
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
