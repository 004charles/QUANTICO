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
        <Route path="/reports" component={Reports} />
        <Route path="/settings"><Module eyebrow="Configurações" title="Governe a inteligência da sua organização." description="Administre organização, utilizadores, permissões, fontes de dados e políticas de acesso em uma única área." /></Route>
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
