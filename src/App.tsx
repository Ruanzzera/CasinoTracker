import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NotificationProvider } from "@/components/NotificationProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Analytics from "./pages/Analytics";
import Auth from "./pages/Auth";
import Notifications from "./pages/Notifications";
import TipJar from "./pages/TipJar";
import Tournaments from "./pages/Tournaments";
import BetAndWin from "./pages/BetAndWin";
import Alavancagem from "./pages/Alavancagem";
import DailyTasks from "./pages/DailyTasks";
import PendingBalances from "./pages/PendingBalances";
import NotFound from "./pages/NotFound";
import OAuthConsent from "./pages/OAuthConsent";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/tip-jar" element={<ProtectedRoute><TipJar /></ProtectedRoute>} />
              <Route path="/tournaments" element={<ProtectedRoute><Tournaments /></ProtectedRoute>} />
              <Route path="/bet-and-win" element={<ProtectedRoute><BetAndWin /></ProtectedRoute>} />
              <Route path="/alavancagem" element={<ProtectedRoute><Alavancagem /></ProtectedRoute>} />
              <Route path="/tarefas" element={<ProtectedRoute><DailyTasks /></ProtectedRoute>} />
              <Route path="/saldos" element={<ProtectedRoute><PendingBalances /></ProtectedRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
