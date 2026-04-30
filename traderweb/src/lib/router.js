import { startTransition, useEffect, useState } from 'react';

function getLocationSnapshot() {
  const searchParams = new URLSearchParams(window.location.search);

  return {
    pathname: window.location.pathname,
    search: window.location.search,
    query: Object.fromEntries(searchParams.entries()),
    searchParams,
  };
}

export function buildPath(pathname, query = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    searchParams.set(key, String(value));
  });

  const search = searchParams.toString();
  return search ? `${pathname}?${search}` : pathname;
}

export const paths = {
  home: () => '/',
  categories: () => '/categories',
  wishlist: () => '/wishlist',
  cart: () => '/cart',
  terms: () => '/terms-and-conditions',
  support: () => '/support',
  paymentMethods: () => '/payment-methods',
  aboutUs: () => '/about-us',
  contactUs: () => '/contact-us',
  cookiePolicy: () => '/cookie-policy',
  products: (query = {}) => buildPath('/products', query),
  product: (productId) => `/products/${productId}`,
  stores: (query = {}) => buildPath('/stores', query),
  store: (storeId) => `/stores/${storeId}`,
};

export function useRouteMatch(pathname) {
  if (pathname === '/') {
    return { name: 'home', params: {} };
  }

  if (pathname === '/categories') {
    return { name: 'categories', params: {} };
  }

  if (pathname === '/wishlist') {
    return { name: 'wishlist', params: {} };
  }

  if (pathname === '/cart') {
    return { name: 'cart', params: {} };
  }

  if (pathname === '/terms-and-conditions') {
    return { name: 'terms', params: {} };
  }

  if (pathname === '/support') {
    return { name: 'support', params: {} };
  }

  if (pathname === '/payment-methods') {
    return { name: 'paymentMethods', params: {} };
  }

  if (pathname === '/about-us') {
    return { name: 'aboutUs', params: {} };
  }

  if (pathname === '/contact-us') {
    return { name: 'contactUs', params: {} };
  }

  if (pathname === '/cookie-policy') {
    return { name: 'cookiePolicy', params: {} };
  }

  if (pathname === '/products') {
    return { name: 'products', params: {} };
  }

  if (pathname === '/stores') {
    return { name: 'stores', params: {} };
  }

  const productMatch = pathname.match(/^\/products\/([^/]+)$/);
  if (productMatch) {
    return { name: 'product', params: { productId: productMatch[1] } };
  }

  const storeMatch = pathname.match(/^\/stores\/([^/]+)$/);
  if (storeMatch) {
    return { name: 'store', params: { storeId: storeMatch[1] } };
  }

  return { name: 'notFound', params: {} };
}

export function useAppRouter() {
  const [location, setLocation] = useState(getLocationSnapshot);

  useEffect(() => {
    const handlePopState = () => {
      setLocation(getLocationSnapshot());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (target) => {
    if (!target || target === `${location.pathname}${location.search}`) {
      return;
    }

    startTransition(() => {
      window.history.pushState({}, '', target);
      setLocation(getLocationSnapshot());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  return { location, navigate };
}
