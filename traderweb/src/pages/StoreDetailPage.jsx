import { useEffect, useState } from 'react';
import AppLink from '../components/AppLink';
import EmptyState from '../components/EmptyState';
import LoadingPanel from '../components/LoadingPanel';
import ProductCard from '../components/ProductCard';
import SectionHeading from '../components/SectionHeading';
import { marketplaceApi } from '../lib/api';
import {
  formatCompactNumber,
  formatRating,
  resolveAssetUrl,
} from '../lib/format';
import { paths } from '../lib/router';

export default function StoreDetailPage({ router, route }) {
  const { storeId } = route.params;
  const [state, setState] = useState({
    loading: true,
    error: '',
    store: null,
    products: [],
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({
        loading: true,
        error: '',
        store: null,
        products: [],
      });

      try {
        const [store, products] = await Promise.all([
          marketplaceApi.getStore(storeId),
          marketplaceApi.getProducts({ store_id: storeId, per_page: 8 }),
        ]);

        if (!cancelled) {
          setState({
            loading: false,
            error: '',
            store,
            products: products.items || [],
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            loading: false,
            error: error.message,
            store: null,
            products: [],
          });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  if (state.loading) {
    return <LoadingPanel label="Loading store profile..." />;
  }

  if (state.error || !state.store) {
    return (
      <EmptyState
        title="Store unavailable"
        description={state.error || 'The store profile could not be loaded.'}
        action={
          <AppLink
            className="inline-flex rounded-full bg-[#1d4ed8] px-5 py-3 text-sm font-semibold text-white"
            router={router}
            to={paths.stores()}
          >
            Back to stores
          </AppLink>
        }
      />
    );
  }

  const { store, products } = state;

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-[2.4rem] border border-black/5 bg-white shadow-[0_28px_75px_rgba(15,23,42,0.08)]">
        <div className="relative h-72 overflow-hidden bg-[linear-gradient(135deg,_#111827,_#1d4ed8)]">
          <img
            alt={store.name}
            className="h-full w-full object-cover opacity-70"
            src={resolveAssetUrl(store.banner || store.logo, store.name)}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.72))]" />
          <div className="absolute bottom-8 left-8 flex flex-col gap-5 md:flex-row md:items-end">
            <img
              alt={`${store.name} logo`}
              className="h-24 w-24 rounded-[1.8rem] border border-white/35 object-cover shadow-[0_24px_60px_rgba(15,23,42,0.35)]"
              src={resolveAssetUrl(store.logo || store.banner, store.name)}
            />
            <div className="text-white">
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-white/75">
                Marketplace store
              </div>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                {store.name}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">
                {store.description ||
                  'This seller profile is powered by the Laravel public store API.'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-8 md:grid-cols-4">
          <Metric label="Rating" value={formatRating(store.rating_avg)} />
          <Metric
            label="Products"
            value={formatCompactNumber(store.products_count)}
          />
          <Metric
            label="Followers"
            value={formatCompactNumber(store.followers_count)}
          />
          <Metric
            label="WhatsApp"
            value={store.business_whatsapp_url ? 'Available' : 'Not set'}
          />
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Catalog"
          title={`Products from ${store.name}`}
          description="This grid is filtered by `store_id` against the public products endpoint."
          action={
            <AppLink
              className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#ff3a3d]/35 hover:text-[#ff3a3d]"
              router={router}
              to={paths.products({ store_id: store.id })}
            >
              Open full catalog
            </AppLink>
          }
        />

        {products.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} router={router} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No published products for this store"
            description="The store exists, but no published items were returned by the current API filter."
          />
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-[1.5rem] bg-[#f8fafc] p-5">
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-950">{value}</div>
    </div>
  );
}
