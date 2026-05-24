import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "./context/AppContext";
import AgeGate from "./components/AgeGate";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Profiles from "./pages/Profiles";
import ProfileDetail from "./pages/ProfileDetail";
import LiveFeeds from "./pages/LiveFeeds";
import Messages from "./pages/Messages";
import Rewards from "./pages/Rewards";
import VipLounge from "./pages/VipLounge";
import CreatorDashboard from "./pages/CreatorDashboard";
import BecomeCreator from "./pages/BecomeCreator";
import Account from "./pages/Account";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <WouterRouter>
            <AgeGate>
              <Navbar />
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/profiles" component={Profiles} />
                <Route path="/profile/:id" component={ProfileDetail} />
                <Route path="/live" component={LiveFeeds} />
                <Route path="/messages" component={Messages} />
                <Route path="/rewards" component={Rewards} />
                <Route path="/vip" component={VipLounge} />
                <Route path="/creator-dashboard" component={CreatorDashboard} />
                <Route path="/become-creator" component={BecomeCreator} />
                <Route path="/account" component={Account} />
              </Switch>
              <Toaster />
            </AgeGate>
          </WouterRouter>
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
