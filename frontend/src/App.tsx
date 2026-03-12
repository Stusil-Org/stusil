import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Community from "./pages/Community";
import Portfolio from "./pages/Portfolio";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import Projects from "./pages/Projects";
import Startups from "./pages/Startups";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Join from "./pages/Join";
import PublicPortfolio from "./pages/PublicPortfolio";
import About from "./pages/About";
import Explore from "./pages/Explore";
import Connections from "./pages/Connections";
import NotFound from "./pages/NotFound";
import GetStarted from "./pages/GetStarted";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/join" element={<Join />} />
          <Route path="/signup" element={<Join />} />
          <Route path="/get-started" element={<GetStarted />} />
          <Route path="/about" element={<About />} />
          <Route path="/u/:username" element={<PublicPortfolio />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Index />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/community" element={<Community />} />
            <Route path="/connections" element={<Connections />} />
            <Route path="/startups" element={<Startups />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/explore" element={<Explore />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
