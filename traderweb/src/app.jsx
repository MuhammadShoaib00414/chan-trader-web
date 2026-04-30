import { ShopStoreProvider } from './lib/shop-store';
import { useAppRouter, useRouteMatch } from './lib/router';
import Shell from './components/Shell';
import AboutPage from './pages/AboutPage';
import CartPage from './pages/CartPage';
import CategoriesPage from './pages/CategoriesPage';
import ContactPage from './pages/ContactPage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import PaymentMethodsPage from './pages/PaymentMethodsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProductsPage from './pages/ProductsPage';
import StoreDetailPage from './pages/StoreDetailPage';
import StoresPage from './pages/StoresPage';
import SupportPage from './pages/SupportPage';
import TermsPage from './pages/TermsPage';
import WishlistPage from './pages/WishlistPage';

const pageMap = {
  home: HomePage,
  categories: CategoriesPage,
  wishlist: WishlistPage,
  cart: CartPage,
  terms: TermsPage,
  support: SupportPage,
  paymentMethods: PaymentMethodsPage,
  aboutUs: AboutPage,
  contactUs: ContactPage,
  cookiePolicy: CookiePolicyPage,
  products: ProductsPage,
  product: ProductDetailPage,
  stores: StoresPage,
  store: StoreDetailPage,
  notFound: NotFoundPage,
};

export default function App() {
  const router = useAppRouter();
  const route = useRouteMatch(router.location.pathname);
  const Page = pageMap[route.name] ?? NotFoundPage;

  return (
    <ShopStoreProvider>
      <Shell router={router} route={route}>
        <Page router={router} route={route} />
      </Shell>
    </ShopStoreProvider>
  );
}
