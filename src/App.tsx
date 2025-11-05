import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Menu from "./pages/Menu";
import Scheduling from "./pages/Scheduling";
import Schedules from "./pages/Schedules";
import NotFound from "./pages/NotFound";
import Navigation from "./components/Navigation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route
              path="/menu"
              element={
                <>
                  <div className="hidden md:block md:p-4 md:bg-background">
                    <div className="max-w-6xl mx-auto">
                      <Navigation />
                    </div>
                  </div>
                  <Menu />
                  <div className="md:hidden">
                    <Navigation />
                  </div>
                </>
              }
            />
            <Route
              path="/scheduling"
              element={
                <>
                  <div className="hidden md:block md:p-4 md:bg-background">
                    <div className="max-w-6xl mx-auto">
                      <Navigation />
                    </div>
                  </div>
                  <Scheduling />
                  <div className="md:hidden">
                    <Navigation />
                  </div>
                </>
              }
            />
            <Route path="/schedules" element={<Schedules />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
