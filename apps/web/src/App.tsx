/**
 * CRAVR — App Router
 * Velvet Dark Design System
 * All routes, providers, age gate, and navigation.
 * Heavy pages are lazy-loaded to keep the initial bundle lean.
 */
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppProvider } from "./contexts/AppContext";
import { AgeGate } from "./components/AgeGate";
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";
import { RequireAuth } from "./components/RequireAuth";

// ── Eager pages (lightweight — always needed on first visit) ──────────────────
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import LegalHub from "./pages/LegalHub";

// ── Lazy pages (heavy — split into async chunks to reduce initial load) ───────
const Profiles         = lazy(() => import("./pages/Profiles"));
const ProfileDetail    = lazy(() => import("./pages/ProfileDetail"));
const LiveFeeds        = lazy(() => import("./pages/LiveFeeds"));
const StreamView       = lazy(() => import("./pages/StreamView"));
const Messages         = lazy(() => import("./pages/Messages"));
const CreditsStore     = lazy(() => import("./pages/CreditsStore"));
const GiftsStore       = lazy(() => import("./pages/GiftsStore"));
const BoostsPage       = lazy(() => import("./pages/BoostsPage"));
const VipLounge        = lazy(() => import("./pages/VipLounge"));
const BecomeCreator    = lazy(() => import("./pages/BecomeCreator"));
const Account          = lazy(() => import("./pages/Account"));
const CreatorDashboard = lazy(() => import("./pages/CreatorDashboard"));
const CreatorLiveStudio = lazy(() => import("./pages/CreatorLiveStudio"));
const Billing          = lazy(() => import("./pages/Billing"));
const AgeVerification    = lazy(() => import("./pages/AgeVerification"));
const AdminVerifyQueue   = lazy(() => import("./pages/AdminVerifyQueue"));
const LegalPages         = lazy(() => import("./pages/LegalPages"));
const ForgotPassword     = lazy(() => import("./pages/ForgotPassword"));
const DevReset           = lazy(() => import("./pages/DevReset"));

// ── Page loading fallback ─────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "#14b8a6", borderTopColor: "transparent" }} />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Public — browsable without an account */}
        <Route path="/" component={Home} />
        <Route path="/profiles" component={Profiles} />
        <Route path="/profile/:id" component={ProfileDetail} />
        <Route path="/live" component={LiveFeeds} />
        <Route path="/live/:id" component={StreamView} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />

        {/* Account-required — prompt sign-in/register when signed out */}
        <Route path="/messages" component={() => <RequireAuth action="view your messages"><Messages /></RequireAuth>} />
        <Route path="/credits" component={() => <RequireAuth action="buy credits"><CreditsStore /></RequireAuth>} />
        <Route path="/gifts" component={() => <RequireAuth action="send gifts"><GiftsStore /></RequireAuth>} />
        <Route path="/boosts" component={() => <RequireAuth action="boost your profile"><BoostsPage /></RequireAuth>} />
        <Route path="/vip-lounge" component={() => <RequireAuth action="access the VIP lounge"><VipLounge /></RequireAuth>} />
        <Route path="/become-creator" component={BecomeCreator} />
        <Route path="/account" component={() => <RequireAuth action="manage your account"><Account /></RequireAuth>} />
        <Route path="/creator/studio" component={() => <RequireAuth action="open the creator studio"><CreatorLiveStudio /></RequireAuth>} />
        <Route path="/creator" component={() => <RequireAuth action="view your creator dashboard"><CreatorDashboard /></RequireAuth>} />
        <Route path="/billing" component={() => <RequireAuth action="manage billing"><Billing /></RequireAuth>} />
        <Route path="/verify-age" component={AgeVerification} />
        <Route path="/admin/verify-queue" component={() => <RequireAuth admin><AdminVerifyQueue /></RequireAuth>} />
        <Route path="/legal" component={LegalHub} />
        <Route path="/legal/:page" component={LegalPages} />
        <Route path="/dev/reset" component={DevReset} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#09091a" }}>
      <AgeGate />
      <Navigation />
      <main className="flex-1">
        <Router />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AppProvider>
          <TooltipProvider>
            <Toaster theme="dark" position="top-right" />
            <AppLayout />
          </TooltipProvider>
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
