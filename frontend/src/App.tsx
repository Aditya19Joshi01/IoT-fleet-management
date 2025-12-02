import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { MainLayout } from "./components/layout/MainLayout";
import Login from "./pages/Login";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

// Lazy load pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const LiveMap = lazy(() => import("./pages/LiveMap"));
const Fleet = lazy(() => import("./pages/Fleet"));
const VehicleDetail = lazy(() => import("./pages/VehicleDetail"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes with layout */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            } />
            <Route path="/live-map" element={
              <Suspense fallback={<PageLoader />}>
                <LiveMap />
              </Suspense>
            } />
            <Route path="/fleet" element={
              <Suspense fallback={<PageLoader />}>
                <Fleet />
              </Suspense>
            } />
            <Route path="/vehicles/:id" element={
              <Suspense fallback={<PageLoader />}>
                <VehicleDetail />
              </Suspense>
            } />
            <Route path="/analytics" element={
              <Suspense fallback={<PageLoader />}>
                <Analytics />
              </Suspense>
            } />
            <Route path="/settings" element={
              <Suspense fallback={<PageLoader />}>
                <Settings />
              </Suspense>
            } />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 */}
          <Route path="*" element={
            <Suspense fallback={<PageLoader />}>
              <NotFound />
            </Suspense>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
