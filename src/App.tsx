import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { HelmetProvider } from "react-helmet-async";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import TasksPage from "@/pages/TasksPage";
import TournamentsPage from "@/pages/TournamentsPage";
import DepositPage from "@/pages/DepositPage";
import WithdrawPage from "@/pages/WithdrawPage";
import AdminPanel from "@/pages/AdminPanel";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SupportWidget from "@/components/SupportWidget";

const App = () => {
  return (
    <HelmetProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
            <Route path="/dashboard/tournaments" element={<ProtectedRoute><TournamentsPage /></ProtectedRoute>} />
            <Route path="/dashboard/deposit" element={<ProtectedRoute><DepositPage /></ProtectedRoute>} />
            <Route path="/dashboard/withdraw" element={<ProtectedRoute><WithdrawPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPanel /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <SupportWidget />
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
  );
};

export default App;
