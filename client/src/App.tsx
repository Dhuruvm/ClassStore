import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Sell from "@/pages/sell";
import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admin";
import AdminAddProduct from "@/pages/admin-add-product";
import OrderPage from "@/pages/order";
import OrdersPage from "@/pages/orders";
import TermsPage from "@/pages/terms";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sell" component={Sell} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/order/:productId" component={OrderPage} />
      <Route path="/orders" component={OrdersPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/add-product" component={AdminAddProduct} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
