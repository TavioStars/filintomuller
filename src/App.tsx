import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoadingScreen from "./components/LoadingScreen";
import { AuthProvider, ProtectedRoute } from "./hooks/useAuth";
import Index from "./pages/Index";
import Menu from "./pages/Menu";
import Schedules from "./pages/Schedules";
import Scheduling from "./pages/Scheduling";
import Notifications from "./pages/Notifications";
import NotificationDetail from "./pages/NotificationDetail";
import Materials from "./pages/Materials";
import CategoryMaterials from "./pages/CategoryMaterials";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import AdminPanel from "./pages/AdminPanel";
import AccessPending from "./pages/AccessPending";
import AccessDenied from "./pages/AccessDenied";

const queryClient = new QueryClient();

const App = () => {
  // Apply theme from localStorage immediately on mount
  useEffect(() => {
    const theme = localStorage.getItem("theme") || "light";
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/access-denied" element={<AccessDenied />} />
              <Route path="/menu" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
              <Route path="/schedules" element={<ProtectedRoute><Schedules /></ProtectedRoute>} />
              <Route path="/scheduling" element={<ProtectedRoute><Scheduling /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute allowAnonymous><Notifications /></ProtectedRoute>} />
              <Route path="/notifications/:id" element={<ProtectedRoute allowAnonymous><NotificationDetail /></ProtectedRoute>} />
              <Route path="/materials" element={<ProtectedRoute allowAnonymous><Materials /></ProtectedRoute>} />
              <Route path="/materials/category/:id" element={<ProtectedRoute allowAnonymous><CategoryMaterials /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
              <Route path="/access-pending" element={<ProtectedRoute><AccessPending /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
