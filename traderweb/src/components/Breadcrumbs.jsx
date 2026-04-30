import AppLink from './AppLink';
import { paths } from '../lib/router';

const routeLabels = {
  categories: 'Categories',
  terms: 'Terms and Conditions',
  support: 'Support',
  paymentMethods: 'Payment Methods',
  aboutUs: 'About Us',
  contactUs: 'Contact Us',
  cookiePolicy: 'Cookie Policy',
  products: 'Shop',
  product: 'Product Detail',
  stores: 'Stores',
  store: 'Store Detail',
  wishlist: 'Wishlist',
  cart: 'Cart',
};

export default function Breadcrumbs({ router, route }) {
  if (route.name === 'home') {
    return null;
  }

  const items = [{ label: 'Home', href: paths.home() }];

  if (route.name === 'product') {
    items.push({ label: 'Shop', href: paths.products() });
  } else if (route.name === 'store') {
    items.push({ label: 'Stores', href: paths.stores() });
  }

  items.push({
    label: routeLabels[route.name] || 'Page',
    href: null,
  });

  return (
    <div className="border-b border-black/5 bg-[#fafafa]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3 text-sm text-slate-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <div key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <AppLink
                  className="transition hover:text-[#ff3a3d]"
                  router={router}
                  to={item.href}
                >
                  {item.label}
                </AppLink>
              ) : (
                <span className={isLast ? 'font-medium text-slate-800' : ''}>
                  {item.label}
                </span>
              )}
              {!isLast ? <span>/</span> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
