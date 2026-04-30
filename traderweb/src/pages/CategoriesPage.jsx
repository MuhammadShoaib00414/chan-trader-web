import { useEffect, useState } from 'react';
import AppLink from '../components/AppLink';
import EmptyState from '../components/EmptyState';
import LoadingPanel from '../components/LoadingPanel';
import SectionHeading from '../components/SectionHeading';
import { categoryFamilies } from '../content/siteContent';
import { marketplaceApi } from '../lib/api';
import { paths } from '../lib/router';
import { formatCompactNumber, resolveAssetUrl } from '../lib/format';

export default function CategoriesPage({ router }) {
  const [state, setState] = useState({
    loading: true,
    error: '',
    items: [],
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ loading: true, error: '', items: [] });

      try {
        const [categories, counts] = await Promise.all([
          marketplaceApi.getCategories(),
          marketplaceApi.getCategoryCounts(),
        ]);

        const countMap = new Map(
          (counts.categories || []).map((item) => [item.id, item.products_count]),
        );

        const items = (categories.items || []).map((category) => ({
          ...category,
          products_count: countMap.get(category.id) || 0,
        }));

        if (!cancelled) {
          setState({ loading: false, error: '', items });
        }
      } catch (error) {
        if (!cancelled) {
          setState({ loading: false, error: error.message, items: [] });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.loading) {
    return <LoadingPanel label="Loading category directory..." />;
  }

  if (state.error) {
    return (
      <EmptyState
        title="Unable to load categories"
        description={state.error}
      />
    );
  }

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-[2.4rem] border border-black/5 bg-[linear-gradient(135deg,_#111827,_#172554_55%,_#ff3a3d)] p-8 text-white shadow-[0_32px_90px_rgba(15,23,42,0.18)] md:p-10">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-white/75">
            Categories
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            Browse the marketplace the way electronics buyers actually shop.
          </h1>
          <p className="mt-4 text-base leading-7 text-white/80 md:text-lg">
            Start with broad families, then move into live Laravel categories
            and filtered product lists.
          </p>
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Families"
          title="Featured category groups"
          description="These groups were introduced to mirror a fuller electronics storefront navigation model."
        />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {categoryFamilies.map((category, index) => (
            <AppLink
              key={category.title}
              className="rounded-[1.8rem] border border-black/5 bg-white p-6 shadow-[0_24px_65px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_32px_90px_rgba(15,23,42,0.11)]"
              router={router}
              to={paths.products()}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eff6ff] text-sm font-semibold text-[#1d4ed8]">
                {String(index + 1).padStart(2, '0')}
              </div>
              <h2 className="mt-5 text-xl font-semibold text-slate-950">
                {category.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {category.description}
              </p>
            </AppLink>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Live Catalog"
          title="Published categories from the Laravel API"
          description="Each tile uses the category inventory counts returned by the products API."
        />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {state.items.map((category) => (
            <AppLink
              key={category.id}
              className="group overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_24px_65px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_32px_90px_rgba(15,23,42,0.11)]"
              router={router}
              to={paths.products({ category_id: category.id })}
            >
              <div className="aspect-[16/8] overflow-hidden bg-[#f8fafc]">
                <img
                  alt={category.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  src={resolveAssetUrl(category.image, category.name)}
                />
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold text-slate-950">
                    {category.name}
                  </h3>
                  <div className="rounded-full bg-[#fff1f1] px-3 py-1 text-xs font-semibold text-[#ff3a3d]">
                    {formatCompactNumber(category.products_count)} items
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Open the filtered catalog view for {category.name.toLowerCase()}.
                </p>
              </div>
            </AppLink>
          ))}
        </div>
      </section>
    </div>
  );
}
