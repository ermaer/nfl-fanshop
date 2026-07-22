import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import About from "./pages/About";
import AdminPage from "./pages/admin/AdminPage";
import BuyingGuide from "./pages/BuyingGuide";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Faq from "./pages/Faq";
import Home from "./pages/Home";
import MyOrders from "./pages/MyOrders";
import NewsDetail from "./pages/NewsDetail";
import NewsList from "./pages/NewsList";
import OrderSuccess from "./pages/OrderSuccess";
import ProductDetail from "./pages/ProductDetail";
import Shop from "./pages/Shop";
import SizeGuide from "./pages/SizeGuide";
import Teams from "./pages/Teams";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/shop"} component={Shop} />
      <Route path={"/teams"} component={Teams} />
      <Route path={"/faq"} component={Faq} />
      <Route path={"/about"} component={About} />
      <Route path={"/buying-guide"} component={BuyingGuide} />
      <Route path={"/size-guide"} component={SizeGuide} />
      <Route path={"/news"} component={NewsList} />
      <Route path={"/news/:slug"} component={NewsDetail} />
      <Route path={"/product/:id"} component={ProductDetail} />
      <Route path={"/cart"} component={Cart} />
      <Route path={"/checkout"} component={Checkout} />
      <Route path={"/order-success"} component={OrderSuccess} />
      <Route path={"/orders"} component={MyOrders} />
      <Route path={"/admin"} component={AdminPage} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
