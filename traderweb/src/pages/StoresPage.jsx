import { useEffect, useState } from 'react';
import EmptyState from '../components/EmptyState';
import LoadingPanel from '../components/LoadingPanel';
import Pagination from '../components/Pagination';
import SectionHeading from '../components/SectionHeading';
import StoreCard from '../components/StoreCard';
import { marketplaceApi } from '../lib/api';
import { paths } from '../lib/router';

export default function StoresPage({ router }) {
  const { query } = router.location;
  const [search, setSearch] = useState(query.q || '');
  const [state, setState] = useState({
    loading: true,
    error: '',
    items: [],
    pagination: null,
  });

  useEffect(() => {
    setSearch(query.q || '');
  }, [query.q]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState((current) => ({ ...current, loading: true, error: '' }));

      try {
        const data = await marketplaceApi.getStores({
          q: query.q,
          page: query.page || 1,
          per_page: 9,
        });

        if (!cancelled) {
          setState({
            loading: false,
            error: '',
            items: data.items || [],
            pagination: data.pagination,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            loading: false,
            error: error.message,
            items: [],
            pagination: null,
          });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [query.page, query.q]);

  const applySearch = (event) => {
    event.preventDefault();
    router.navigate(paths.stores({ q: search.trim() }));
  };

  const onPageChange = (page) => {
    router.navigate(
      paths.stores({
        ...query,
        page,
      }),
    );
  };

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Sellers"
        title="Explore active marketplace stores"
        description="Store search is driven by the public `/api/app/stores` endpoint."
      />

      <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_24px_65px_rgba(15,23,42,0.06)]">
        <form className="flex flex-col gap-3 md:flex-row" onSubmit={applySearch}>
          <input
            className="h-12 flex-1 rounded-full border border-black/8 px-5 outline-none transition focus:border-[#1d4ed8] focus:shadow-[0_0_0_4px_rgba(29,78,216,0.12)]"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search store by name"
          />
          <button
            className="h-12 rounded-full bg-[#1d4ed8] px-5 text-sm font-semibold text-white transition hover:bg-[#163ea8]"
            type="submit"
          >
            Search stores
          </button>
        </form>
      </section>

      {state.loading ? <LoadingPanel label="Loading stores..." /> : null}
      {!state.loading && state.error ? (
        <EmptyState title="Unable to load stores" description={state.error} />
      ) : null}

      {!state.loading && !state.error && !state.items.length ? (
        <EmptyState
          title="No stores found"
          description="Try a different seller name or clear the current search."
        />
      ) : null}

      {!state.loading && !state.error && state.items.length ? (
        <section>
          <div className="grid gap-6 lg:grid-cols-3">
            {state.items.map((store) => (
              <StoreCard key={store.id} router={router} store={store} />
            ))}
          </div>

          <Pagination
            currentPage={state.pagination?.current_page || 1}
            lastPage={state.pagination?.last_page || 1}
            onPageChange={onPageChange}
          />
        </section>
      ) : null}
    </div>
  );
}
