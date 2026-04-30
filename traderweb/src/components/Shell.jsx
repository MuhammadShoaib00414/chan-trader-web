import { useEffect, useState } from 'react';
import { Heart, ShoppingCart, User } from 'lucide-react';
import AppLink from './AppLink';
import Breadcrumbs from './Breadcrumbs';
import {
  categoryFamilies,
  contactDetails,
  footerGroups,
  primaryNav,
  utilityLinks,
} from '../content/siteContent';
import { DOCS_URL } from '../lib/config';
import { useShopStore } from '../lib/shop-store';
import { paths } from '../lib/router';

export default function Shell({ children, router, route }) {
  const { cartCount, wishlistCount } = useShopStore();
  const [search, setSearch] = useState(router.location.query.q || '');

  useEffect(() => {
    setSearch(router.location.query.q || '');
  }, [router.location.query.q]);

  const submitSearch = (event) => {
    event.preventDefault();
    router.navigate(paths.products({ q: search.trim() }));
  };

  const isProductsRoute = route.name === 'products' || route.name === 'product';
  const isStoresRoute = route.name === 'stores' || route.name === 'store';

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[32rem] bg-[linear-gradient(180deg,_#fff7f5_0%,_#ffffff_48%)]" />

      <header className="sticky top-0 z-30 border-b border-black/5 bg-white">
        <div className="border-b border-black/5 bg-[#1b1f23] text-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 text-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="text-white/75">
              Welcome to TraderWeb, online electronics marketplace
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:gap-5">
              {utilityLinks.map((item) => (
                <AppLink
                  key={item.label}
                  className="text-white/80 transition hover:text-white"
                  router={router}
                  to={item.href}
                >
                  {item.label}
                </AppLink>
              ))}
              <a
                className="text-white/70 transition hover:text-white"
                href={DOCS_URL}
                rel="noreferrer"
                target="_blank"
              >
                Developer Docs
              </a>
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5">
          <div className="grid gap-4 xl:grid-cols-[16rem_1fr_auto] xl:items-center">
            <div className="flex items-center justify-between gap-4">
              <AppLink
                router={router}
                to={paths.home()}
                className="flex items-center gap-3 text-sm font-semibold tracking-[0.22em] text-[#111827] uppercase"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#ff3a3d] text-lg font-black text-white">
                  T
                </span>
                <span>
                  <span className="block text-[0.72rem] tracking-[0.3em] text-slate-500">
                    Electronics Marketplace
                  </span>
                  <span className="block text-lg tracking-[0.18em] text-slate-950">
                    TraderWeb
                  </span>
                </span>
              </AppLink>
            </div>

            <div className="flex flex-1 flex-col gap-3">
              <form className="flex flex-col gap-3 md:flex-row" onSubmit={submitSearch}>
                <div className="flex-1">
                  <input
                    className="h-[3.25rem] w-full rounded-sm border border-black/10 bg-[#fafafa] px-5 text-sm outline-none ring-0 transition placeholder:text-slate-400 focus:border-[#ff3a3d] focus:bg-white"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search products, deals, components, or SKU"
                  />
                </div>
                <button
                  className="inline-flex h-[3.25rem] items-center justify-center rounded-sm bg-[#ff3a3d] px-6 text-sm font-semibold text-white transition hover:bg-[#ef2f33]"
                  type="submit"
                >
                  Search catalog
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                <span className="rounded-full bg-[#fff1f1] px-3 py-2 text-[#ff3a3d]">
                  Browse by category
                </span>
                {categoryFamilies.slice(0, 5).map((category) => (
                  <AppLink
                    key={category.title}
                    className="rounded-sm bg-[#f8fafc] px-3 py-2 transition hover:bg-[#fff1f1] hover:text-[#ff3a3d]"
                    router={router}
                    to={paths.categories()}
                  >
                    {category.title}
                  </AppLink>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 xl:justify-end">
              <HeaderAction
                count={wishlistCount}
                icon={<Heart className="h-4 w-4" />}
                label="Wishlist"
                router={router}
                to={paths.wishlist()}
              />
              <HeaderAction
                count={cartCount}
                icon={<ShoppingCart className="h-4 w-4" />}
                label="Cart"
                router={router}
                to={paths.cart()}
              />
              <div className="hidden items-center gap-3 rounded-sm border border-black/10 px-4 py-3 text-sm text-slate-600 xl:inline-flex">
                <User className="h-4 w-4" />
                <div>
                  <div className="font-medium text-slate-900">My Account</div>
                  <div className="text-xs text-slate-500">Sign in / Register</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-black/5 pt-4 xl:flex-row xl:items-center xl:justify-between">
            <nav className="flex flex-wrap items-center gap-2">
              <AppLink
                className={`rounded-sm px-4 py-2 text-sm font-semibold transition ${
                  route.name === 'categories'
                    ? 'bg-[#ff3a3d] text-white'
                    : 'bg-[#ff3a3d] text-white hover:bg-[#ef2f33]'
                }`}
                router={router}
                to={paths.categories()}
              >
                All Categories
              </AppLink>
              {primaryNav.map((item) => {
                const isActive =
                  item.href === '/'
                    ? route.name === 'home'
                    : router.location.pathname === item.href;

                return (
                  <AppLink
                    key={item.label}
                    router={router}
                    to={item.href}
                    className={`rounded-sm px-4 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-[#ff3a3d] text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </AppLink>
                );
              })}
              <AppLink
                className={`rounded-sm px-4 py-2 text-sm font-medium transition ${
                  isProductsRoute
                    ? 'bg-[#ff3a3d] text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                router={router}
                to={paths.products()}
              >
                Products
              </AppLink>
              <AppLink
                className={`rounded-sm px-4 py-2 text-sm font-medium transition ${
                  isStoresRoute
                    ? 'bg-[#ff3a3d] text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                router={router}
                to={paths.stores()}
              >
                Stores
              </AppLink>
            </nav>

            <div className="text-sm text-slate-500">
              {contactDetails.email} · {contactDetails.hours}
            </div>
          </div>
        </div>

        <Breadcrumbs router={router} route={route} />
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 lg:py-12">{children}</main>

      <footer className="border-t border-black/5 bg-[#0f172a] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[1.15fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <div className="text-sm font-semibold uppercase tracking-[0.26em] text-white/55">
              TraderWeb
            </div>
            <h2 className="text-3xl font-semibold tracking-tight">
              Cleaner public storefront, same Laravel marketplace backbone.
            </h2>
            <p className="text-sm leading-7 text-white/70">
              The header, footer, policy pages, and category presentation are
              structured to feel closer to a real electronics marketplace while
              still using the live public APIs for products and stores.
            </p>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-white/55">
                {group.title}
              </h3>
              <div className="mt-4 flex flex-col gap-3">
                {group.links.map((link) => (
                  <AppLink
                    key={link.label}
                    className="text-sm text-white/75 transition hover:text-white"
                    router={router}
                    to={link.href}
                  >
                    {link.label}
                  </AppLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 text-sm text-white/60 lg:flex-row lg:items-center lg:justify-between">
            <div>
              {contactDetails.phone} · {contactDetails.email} · {contactDetails.address}
            </div>
            <div className="flex items-center gap-4">
              <AppLink className="hover:text-white" router={router} to={paths.terms()}>
                Terms
              </AppLink>
              <AppLink
                className="hover:text-white"
                router={router}
                to={paths.cookiePolicy()}
              >
                Cookies
              </AppLink>
              <a
                className="hover:text-white"
                href={DOCS_URL}
                rel="noreferrer"
                target="_blank"
              >
                Developer website
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HeaderAction({ router, to, icon, label, count }) {
  return (
    <AppLink
      className="relative inline-flex items-center gap-2 rounded-sm border border-black/10 px-4 py-3 text-sm text-slate-700 transition hover:border-[#ff3a3d] hover:text-[#ff3a3d]"
      router={router}
      to={to}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {count ? (
        <span className="absolute -right-2 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#ff3a3d] px-1 text-[11px] font-semibold text-white">
          {count}
        </span>
      ) : null}
    </AppLink>
  );
}
