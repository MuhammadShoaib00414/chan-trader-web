import { useEffect, useState } from 'react';
import CategorySidebar from '../components/CategorySidebar';
import EmptyState from '../components/EmptyState';
import LoadingPanel from '../components/LoadingPanel';
import Pagination from '../components/Pagination';
import ProductCard from '../components/ProductCard';
import SectionHeading from '../components/SectionHeading';
import { marketplaceApi } from '../lib/api';
import { paths } from '../lib/router';

const sortOptions = [
  { value: 'created_at:desc', label: 'Newest first' },
  { value: 'price:asc', label: 'Price: low to high' },
  { value: 'price:desc', label: 'Price: high to low' },
  { value: 'name:asc', label: 'Name: A to Z' },
];

export default function ProductsPage({ router }) {
  const { query } = router.location;
  const [catalog, setCatalog] = useState({
    loading: true,
    error: '',
    products: [],
    pagination: null,
  });
  const [metadata, setMetadata] = useState({
    categories: [],
    stores: [],
    subcategories: [],
  });
  const [filters, setFilters] = useState({
    q: query.q || '',
    category_id: query.category_id || '',
    subcategory_id: query.subcategory_id || '',
    store_id: query.store_id || '',
    sort: `${query.sort_by || 'created_at'}:${query.sort_dir || 'desc'}`,
  });

  useEffect(() => {
    setFilters({
      q: query.q || '',
      category_id: query.category_id || '',
      subcategory_id: query.subcategory_id || '',
      store_id: query.store_id || '',
      sort: `${query.sort_by || 'created_at'}:${query.sort_dir || 'desc'}`,
    });
  }, [query.category_id, query.q, query.sort_by, query.sort_dir, query.store_id, query.subcategory_id]);

  useEffect(() => {
    let cancelled = false;

    async function loadMetadata() {
      try {
        const [categories, stores] = await Promise.all([
          marketplaceApi.getCategories(),
          marketplaceApi.getStores({ per_page: 100 }),
        ]);

        if (!cancelled) {
          setMetadata((current) => ({
            ...current,
            categories: categories.items || [],
            stores: stores.items || [],
          }));
        }
      } catch {
        if (!cancelled) {
          setMetadata((current) => ({
            ...current,
            categories: [],
            stores: [],
          }));
        }
      }
    }

    loadMetadata();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSubcategories() {
      if (!query.category_id) {
        setMetadata((current) => ({ ...current, subcategories: [] }));
        return;
      }

      try {
        const subcategories = await marketplaceApi.getSubcategories(
          query.category_id,
        );

        if (!cancelled) {
          setMetadata((current) => ({
            ...current,
            subcategories: subcategories.items || [],
          }));
        }
      } catch {
        if (!cancelled) {
          setMetadata((current) => ({ ...current, subcategories: [] }));
        }
      }
    }

    loadSubcategories();
    return () => {
      cancelled = true;
    };
  }, [query.category_id]);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setCatalog((current) => ({ ...current, loading: true, error: '' }));

      try {
        const data = await marketplaceApi.getProducts({
          q: query.q,
          category_id: query.category_id,
          subcategory_id: query.subcategory_id,
          store_id: query.store_id,
          sort_by: query.sort_by || 'created_at',
          sort_dir: query.sort_dir || 'desc',
          page: query.page || 1,
          per_page: 12,
        });

        if (!cancelled) {
          setCatalog({
            loading: false,
            error: '',
            products: data.items || [],
            pagination: data.pagination,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setCatalog({
            loading: false,
            error: error.message,
            products: [],
            pagination: null,
          });
        }
      }
    }

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [query.category_id, query.page, query.q, query.sort_by, query.sort_dir, query.store_id, query.subcategory_id]);

  const applyFilters = (event) => {
    event.preventDefault();
    const [sort_by, sort_dir] = filters.sort.split(':');

    router.navigate(
      paths.products({
        q: filters.q.trim(),
        category_id: filters.category_id,
        subcategory_id: filters.subcategory_id,
        store_id: filters.store_id,
        sort_by,
        sort_dir,
      }),
    );
  };

  const resetFilters = () => {
    router.navigate(paths.products());
  };

  const onPageChange = (page) => {
    router.navigate(
      paths.products({
        ...query,
        page,
      }),
    );
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[16rem_1fr]">
        <div className="space-y-5">
          <CategorySidebar
            activeCategoryId={query.category_id}
            compact
            router={router}
            title="Shop by Category"
          />
        </div>

        <div className="space-y-6">
          <SectionHeading
            eyebrow="Shop"
            title="Search the published marketplace inventory"
            description="Filters and pagination are backed directly by `/api/app/products` and `/api/app/subcategories`."
          />

          <section className="rounded-[1rem] border border-black/8 bg-white p-5 shadow-sm">
            <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" onSubmit={applyFilters}>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 xl:col-span-2">
            Search
            <input
              className="h-12 rounded-sm border border-black/8 px-4 outline-none transition focus:border-[#ff3a3d] focus:shadow-[0_0_0_4px_rgba(255,58,61,0.12)]"
              type="search"
              value={filters.q}
              onChange={(event) =>
                setFilters((current) => ({ ...current, q: event.target.value }))
              }
              placeholder="Product name or SKU"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Category
            <select
              className="h-12 rounded-sm border border-black/8 px-4 outline-none transition focus:border-[#ff3a3d] focus:shadow-[0_0_0_4px_rgba(255,58,61,0.12)]"
              value={filters.category_id}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  category_id: event.target.value,
                  subcategory_id: '',
                }))
              }
            >
              <option value="">All categories</option>
              {metadata.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Subcategory
            <select
              className="h-12 rounded-sm border border-black/8 px-4 outline-none transition focus:border-[#ff3a3d] focus:shadow-[0_0_0_4px_rgba(255,58,61,0.12)]"
              value={filters.subcategory_id}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  subcategory_id: event.target.value,
                }))
              }
            >
              <option value="">All subcategories</option>
              {metadata.subcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Store
            <select
              className="h-12 rounded-sm border border-black/8 px-4 outline-none transition focus:border-[#ff3a3d] focus:shadow-[0_0_0_4px_rgba(255,58,61,0.12)]"
              value={filters.store_id}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  store_id: event.target.value,
                }))
              }
            >
              <option value="">All stores</option>
              {metadata.stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Sort
            <select
              className="h-12 rounded-sm border border-black/8 px-4 outline-none transition focus:border-[#ff3a3d] focus:shadow-[0_0_0_4px_rgba(255,58,61,0.12)]"
              value={filters.sort}
              onChange={(event) =>
                setFilters((current) => ({ ...current, sort: event.target.value }))
              }
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end gap-3 xl:col-span-2">
            <button
              className="h-12 rounded-sm bg-[#ff3a3d] px-5 text-sm font-semibold text-white transition hover:bg-[#ef2f33]"
              type="submit"
            >
              Apply filters
            </button>
            <button
              className="h-12 rounded-sm border border-black/10 px-5 text-sm font-semibold text-slate-700 transition hover:border-[#1d4ed8]/30 hover:text-[#1d4ed8]"
              type="button"
              onClick={resetFilters}
            >
              Reset
            </button>
          </div>
            </form>
          </section>

          {catalog.loading ? <LoadingPanel label="Loading product catalog..." /> : null}
          {!catalog.loading && catalog.error ? (
            <EmptyState
              title="Unable to load products"
              description={catalog.error}
            />
          ) : null}

          {!catalog.loading && !catalog.error && !catalog.products.length ? (
            <EmptyState
              title="No products matched the current filters"
              description="Try a broader search or clear one of the category, store, or subcategory filters."
            />
          ) : null}

          {!catalog.loading && !catalog.error && catalog.products.length ? (
            <section>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="text-sm text-slate-600">
                  Showing {catalog.products.length} items on page{' '}
                  {catalog.pagination?.current_page || 1}.
                </div>
                <div className="text-sm text-slate-500">
                  Category: {metadata.categories.find((item) => String(item.id) === String(query.category_id))?.name || 'All'}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {catalog.products.map((product) => (
                  <ProductCard key={product.id} product={product} router={router} />
                ))}
              </div>

              <Pagination
                currentPage={catalog.pagination?.current_page || 1}
                lastPage={catalog.pagination?.last_page || 1}
                onPageChange={onPageChange}
              />
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}
