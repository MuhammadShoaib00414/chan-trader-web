import { useEffect, useState } from 'react';
import AppLink from '../components/AppLink';
import CategorySidebar from '../components/CategorySidebar';
import EmptyState from '../components/EmptyState';
import HeroSlider from '../components/HeroSlider';
import LoadingPanel from '../components/LoadingPanel';
import ProductCard from '../components/ProductCard';
import SectionHeading from '../components/SectionHeading';
import StoreCard from '../components/StoreCard';
import {
  categoryFamilies,
  trustHighlights,
  utilityLinks,
} from '../content/siteContent';
import { DOCS_URL } from '../lib/config';
import { marketplaceApi } from '../lib/api';
import { paths } from '../lib/router';
import { resolveAssetUrl } from '../lib/format';

export default function HomePage({ router }) {
  const [state, setState] = useState({
    loading: true,
    error: '',
    home: null,
    promotions: [],
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState((current) => ({ ...current, loading: true, error: '' }));

      try {
        const [home, promotions] = await Promise.all([
          marketplaceApi.getHome(),
          marketplaceApi.getPromotions(),
        ]);

        if (!cancelled) {
          setState({
            loading: false,
            error: '',
            home,
            promotions: promotions.items || [],
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            loading: false,
            error: error.message,
            home: null,
            promotions: [],
          });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.loading) {
    return <LoadingPanel label="Building the storefront homepage..." />;
  }

  if (state.error) {
    return (
      <EmptyState
        title="Unable to load home data"
        description={state.error}
        action={
          <button
            className="rounded-full bg-[#ff3a3d] px-5 py-3 text-sm font-semibold text-white"
            type="button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        }
      />
    );
  }

  const { home, promotions } = state;
  const spotlightPromotion = promotions[0];
  const slides = buildSlides(home, promotions);

  return (
    <div className="space-y-8">
      <section className="grid gap-5 xl:grid-cols-[16rem_1fr_18rem]">
        <CategorySidebar compact router={router} />

        <HeroSlider router={router} slides={slides} />

        <div className="grid gap-5">
          <article className="rounded-[1.4rem] border border-black/8 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.26em] text-[#ff3a3d]">
              Customer care
            </div>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">
              Support, payment, and policies are visible from the start.
            </h2>
            <div className="mt-4 flex flex-col gap-2">
              {utilityLinks.map((link) => (
                <AppLink
                  key={link.label}
                  className="rounded-sm border border-black/8 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#ff3a3d] hover:text-[#ff3a3d]"
                  router={router}
                  to={link.href}
                >
                  {link.label}
                </AppLink>
              ))}
            </div>
          </article>

          {spotlightPromotion ? (
            <article className="overflow-hidden rounded-[1.4rem] border border-black/8 bg-white shadow-sm">
              {spotlightPromotion.image ? (
                <img
                  alt={spotlightPromotion.title || 'Promotion'}
                  className="h-44 w-full object-cover"
                  src={resolveAssetUrl(spotlightPromotion.image, 'Promotion')}
                />
              ) : null}
              <div className="p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.26em] text-[#1d4ed8]">
                  Current promotion
                </div>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">
                  {spotlightPromotion.title || spotlightPromotion.name || 'Marketplace promotion'}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {spotlightPromotion.description ||
                    'Promotion content is being served directly from the Laravel promotions API.'}
                </p>
              </div>
            </article>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {trustHighlights.map((item) => (
          <article
            key={item.title}
            className="rounded-[1rem] border border-black/8 bg-white p-5 shadow-sm"
          >
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ff3a3d]">
              Highlight
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-950">
              {item.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {item.description}
            </p>
          </article>
        ))}
      </section>

      <section>
        <SectionHeading
          eyebrow="Featured"
          title="Products selected for the storefront home"
          description="Pulled from `/api/app/home` so the page stays aligned with the Laravel marketplace feed."
          action={
            <AppLink
              className="rounded-sm border border-black/10 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#ff3a3d]/35 hover:text-[#ff3a3d]"
              router={router}
              to={paths.products({ is_featured: true })}
            >
              View all featured
            </AppLink>
          }
        />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {(home.featured_products || []).slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} router={router} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Top Sellers"
          title="Popular products already exposed by the API"
          description="This section uses the same public home payload and now connects directly to local cart and wishlist interactions."
        />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {(home.top_selling || []).slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} router={router} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Categories"
          title="Popular category families"
          description="These family blocks were introduced so the homepage feels closer to a real electronics storefront instead of a generic product feed."
          action={
            <AppLink
              className="rounded-sm border border-black/10 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#1d4ed8]/35 hover:text-[#1d4ed8]"
              router={router}
              to={paths.categories()}
            >
              Open all categories
            </AppLink>
          }
        />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {categoryFamilies.slice(0, 8).map((category, index) => (
            <AppLink
              key={category.title}
              className="group rounded-[1rem] border border-black/8 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,0.08)]"
              router={router}
              to={paths.categories()}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#fff1f1] text-lg font-semibold text-[#ff3a3d]">
                {String(index + 1).padStart(2, '0')}
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-950">
                {category.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {category.description}
              </p>
            </AppLink>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Stores"
          title="Popular marketplace stores"
          description="Store cards are backed by the public `/api/app/stores` and `/api/app/home` responses."
          action={
            <AppLink
              className="rounded-sm border border-black/10 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#1d4ed8]/35 hover:text-[#1d4ed8]"
              router={router}
              to={paths.stores()}
            >
              Browse all stores
            </AppLink>
          }
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {(home.popular_stores || []).map((store) => (
            <StoreCard key={store.id} router={router} store={store} />
          ))}
        </div>
      </section>

      <section className="rounded-[1rem] border border-black/8 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#1d4ed8]">
              Build Notes
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Developer website remains available for the API contract.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The public pages are now styled for shoppers, while the Laravel
              Scribe docs still stay accessible for engineering and integration
              work.
            </p>
          </div>
          <a
            className="inline-flex rounded-sm bg-[#eff6ff] px-5 py-3 text-sm font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe]"
            href={DOCS_URL}
            rel="noreferrer"
            target="_blank"
          >
            Open developer docs
          </a>
        </div>
      </section>
    </div>
  );
}

function buildSlides(home, promotions) {
  const promotionSlides = (promotions || [])
    .filter((item) => item.image || item.title || item.name)
    .slice(0, 3)
    .map((item) => ({
      eyebrow: 'Marketplace promotion',
      title: item.title || item.name || 'Current promotion',
      description:
        item.description ||
        'Browse the latest highlighted stock, featured listings, and marketplace offers.',
      image: item.image || item.banner || home.featured_products?.[0]?.thumb,
      primaryCta: {
        label: 'Shop now',
        href: paths.products(),
      },
      secondaryCta: {
        label: 'Support',
        href: paths.support(),
      },
    }));

  const productSlides = (home.featured_products || []).slice(0, 2).map((item) => ({
    eyebrow: 'Featured product',
    title: item.name,
    description:
      item.short_description ||
      'Published directly from your Laravel API and ready for storefront merchandising.',
    image: item.top_image || item.feature_image || item.thumb,
    primaryCta: {
      label: 'View product',
      href: paths.product(item.id),
    },
    secondaryCta: {
      label: 'Browse categories',
      href: paths.categories(),
    },
  }));

  return [...promotionSlides, ...productSlides];
}
