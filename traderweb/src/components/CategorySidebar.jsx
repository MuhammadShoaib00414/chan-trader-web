import { useEffect, useState } from 'react';
import AppLink from './AppLink';
import { marketplaceApi } from '../lib/api';
import { paths } from '../lib/router';
import { formatCompactNumber } from '../lib/format';

export default function CategorySidebar({
  router,
  activeCategoryId = '',
  title = 'Categories',
  compact = false,
}) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [categoryData, countsData] = await Promise.all([
          marketplaceApi.getCategories(),
          marketplaceApi.getCategoryCounts(),
        ]);

        const countMap = new Map(
          (countsData.categories || []).map((item) => [String(item.id), item.products_count]),
        );

        const merged = (categoryData.items || []).map((item) => ({
          ...item,
          products_count: countMap.get(String(item.id)) || 0,
        }));

        if (!cancelled) {
          setCategories(merged);
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className="rounded-[1.4rem] border border-black/8 bg-white shadow-sm">
      <div className="border-b border-black/6 px-5 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-900">
          {title}
        </h2>
      </div>

      <div className={compact ? 'max-h-[27rem] overflow-auto' : ''}>
        <AppLink
          className={`flex items-center justify-between px-5 py-3 text-sm transition ${
            !activeCategoryId
              ? 'bg-[#fff1f1] font-semibold text-[#ff3a3d]'
              : 'text-slate-700 hover:bg-[#fafafa]'
          }`}
          router={router}
          to={paths.products()}
        >
          <span>All products</span>
          <span className="text-xs text-slate-400">View</span>
        </AppLink>

        {categories.map((category) => {
          const isActive = String(category.id) === String(activeCategoryId || '');

          return (
            <AppLink
              key={category.id}
              className={`flex items-center justify-between gap-3 border-t border-black/4 px-5 py-3 text-sm transition ${
                isActive
                  ? 'bg-[#fff1f1] font-semibold text-[#ff3a3d]'
                  : 'text-slate-700 hover:bg-[#fafafa]'
              }`}
              router={router}
              to={paths.products({ category_id: category.id })}
            >
              <span className="line-clamp-1">{category.name}</span>
              <span className="text-xs text-slate-400">
                {formatCompactNumber(category.products_count)}
              </span>
            </AppLink>
          );
        })}
      </div>
    </aside>
  );
}
