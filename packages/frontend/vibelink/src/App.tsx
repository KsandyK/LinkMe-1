/**
 * LINKME â€” App Router
 * Velvet Dark Design System
 * All routes, providers, age gate, and navigation.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppProvider } from "./contexts/AppContext";
import { AgeGate } from "./components/AgeGate";
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";

// Pages
import Home from "./pages/Home";
import Profiles from "./pages/Profiles";
import ProfileDetail from "./pages/ProfileDetail";
import LiveFeeds from "./pages/LiveFeeds";
import Messages from "./pages/Messages";
import CreditsStore from "./pages/CreditsStore";
import GiftsStore from "./pages/GiftsStore";
import BoostsPage from "./pages/BoostsPage";
import VipLounge from "./pages/VipLounge";
import Register from "./pages/Register";
import BecomeCreator from "./pages/BecomeCreator";
import Account from "./pages/Account";
import CreatorDashboard from "./pages/CreatorDashboard";
import Billing from "./pages/Billing";
import AgeVerification from "./pages/AgeVerification";
import LegalPages from "./pages/LegalPages";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/profiles" component={Profiles} />
      <Route path="/profile/:id" component={ProfileDetail} />
      <Route path="/live" component={LiveFeeds} />
      <Route path="/live/:id" component={LiveFeeds} />
      <Route path="/messages" component={Messages} />
      <Route path="/credits" component={CreditsStore} />
      <Route path="/gifts" component={GiftsStore} />
      <Route path="/boosts" component={BoostsPage} />
      <Route path="/vip-lounge" component={VipLounge} />
      <Route path="/register" component={Register} />
      <Route path="/become-creator" component={BecomeCreator} />
      <Route path="/account" component={Account} />
      <Route path="/creator" component={CreatorDashboard} />
      <Route path="/billing" component={Billing} />
      <Route path="/verify-age" component={AgeVerification} />
      <Route path="/legal/:page" component={LegalPages} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
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
