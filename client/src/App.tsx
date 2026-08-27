import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AskQuantico from "./pages/AskQuantico";
import CustomerIntelligence from "./pages/CustomerIntelligence";
import Forecasting from "./pages/Forecasting";
import GrowthOpportunities from "./pages/GrowthOpportunities";
import Home from "./pages/Home";
import ModulePlaceholder from "./pages/ModulePlaceholder";
import NotFound from "./pages/NotFound";
import DataCenter from "./pages/DataCenter";
import Reports from "./pages/Reports";
import SalesIntelligence from "./pages/SalesIntelligence";
import WorkspaceSetup from "./pages/WorkspaceSetup";
import DataConnectors from "./pages/DataConnectors";
import AnalyticsAreas from "./pages/AnalyticsAreas";
import WorkspaceAccess from "./pages/WorkspaceAccess";
import OperationsDashboard from "./pages/OperationsDashboard";
import ActionCenter from "./pages/ActionCenter";
import { Route, Switch } from "wouter";

function Module({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <ModulePlaceholder eyebrow={eyebrow} title={title} description={description} />;
}

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/ask-quantico" component={AskQuantico} />
        <Route path="/sales" component={SalesIntelligence} />
        <Route path="/customers" component={CustomerIntelligence} />
        <Route path="/growth" component={GrowthOpportunities} />
        <Route path="/forecast" component={Forecasting} />
        <Route path="/data" component={DataCenter} />
        <Route path="/connectors" component={DataConnectors} />
        <Route path="/areas" component={AnalyticsAreas} />
        <Route path="/operations" component={OperationsDashboard} />
        <Route path="/actions" component={ActionCenter} />
        <Route path="/access" component={WorkspaceAccess} />
        <Route path="/reports" component={Reports} />
        <Route path="/onboarding" component={WorkspaceSetup} />
        <Route path="/settings" component={WorkspaceSetup} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider><Toaster /><Router /></TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
