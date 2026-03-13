import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { postJson } from '@/lib/http';
import { ToastStack } from '@/components/ui/toast-stack';

export default function ProductsIndex() {
  type ProductItem = {
    id: number;
    name: string;
    slug: string;
    sku: string;
    price: number;
    has_primary_image?: boolean;
    thumb?: string;
    store?: { id: number; name: string } | null;
    category?: { id: number; name: string } | null;
  };
  type CategoryRef = { id: number; name: string };
  type StoreRef = { id: number; name: string };
  type BrandRef = { id: number; name: string };
  type Pagination = { total: number; per_page: number; current_page: number; last_page: number };
  const { props } = usePage<{ items: any; categories: CategoryRef[]; stores: StoreRef[]; brands: BrandRef[]; pagination?: Pagination; filters?: { q?: string; category_id?: string; store_id?: string; sort_by?: string; sort_dir?: string } }>();
  const rawItems = props.items;
  const items: ProductItem[] = Array.isArray(rawItems)
    ? rawItems
    : Array.isArray((rawItems as any)?.data)
      ? (rawItems as any).data
      : [];
  const categories = props.categories;
  const stores = props.stores;
  const brands = props.brands ?? [];
  const pagination = props.pagination;
  const filters = props.filters ?? {};

  const [storeId, setStoreId] = useState<number>(stores?.[0]?.id ?? 0);
  const [categoryId, setCategoryId] = useState<number>(categories?.[0]?.id ?? 0);
  const [brandId, setBrandId] = useState<number>(brands?.[0]?.id ?? 0);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [toasts, setToasts] = useState<Array<{ id: number; title: string; variant: 'success' | 'error' }>>([]);

  const dismissToast = (id: number) => setToasts((ts) => ts.filter((t) => t.id !== id));
  const showToast = (title: string, variant: 'success' | 'error' = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((ts) => [...ts, { id, title, variant }]);
    setTimeout(() => dismissToast(id), 2500);
  };

  const errorMessageFromResponse = async (res: Response): Promise<string> => {
    try {
      const data = (await res.json()) as any;
      if (data?.message && typeof data.message === 'string') return data.message;
      const firstError = data?.errors ? Object.values<any>(data.errors)?.flat()?.[0] : null;
      if (firstError && typeof firstError === 'string') return firstError;
      return `Request failed (${res.status}).`;
    } catch {
      return `Request failed (${res.status}).`;
    }
  };

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const submitFilters = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const q = String(data.get('q') || '');
    const category_id = String(data.get('category_id') || '');
    const store_id = String(data.get('store_id') || '');
    const sort_by = String(data.get('sort_by') || '');
    const sort_dir = String(data.get('sort_dir') || '');
    router.get(
      '/admin/products',
      {
        q: q || undefined,
        category_id: category_id || undefined,
        store_id: store_id || undefined,
        sort_by: sort_by || undefined,
        sort_dir: sort_dir || undefined,
      },
      { preserveState: true, preserveScroll: true, only: ['items', 'pagination', 'filters'] },
    );
  };
  const goto = (page: number) => {
    router.get('/admin/products', { ...filters, page }, { preserveState: true, preserveScroll: true, only: ['items', 'pagination'] });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await postJson('/api/admin/products', {
      store_id: Number(storeId),
      category_id: Number(categoryId),
      brand_id: brandId ? Number(brandId) : null,
      name, slug, sku,
      price: Number(price),
    });
    if (res.ok) {
      setName('');
      setSlug('');
      setSku('');
      setPrice('');
      showToast('Product created.', 'success');
      router.reload({ only: ['items'] });
      return;
    }
    showToast(await errorMessageFromResponse(res), 'error');
  };

  return (
    <AppLayout breadcrumbs={[{ title: 'Products', href: '/admin/products' }]}>
      <Head title="Products" />
      <div className="grid gap-6 p-4">
        <form onSubmit={submitFilters} className="grid grid-cols-2 gap-3 md:grid-cols-6">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm">Search (name or SKU)</label>
            <Input name="q" defaultValue={filters.q ?? ''} placeholder="MOSFET or SKU-0001" />
          </div>
          <div>
            <label className="mb-1 block text-sm">Store</label>
            <select className="w-full rounded-md border px-2 py-2" name="store_id" defaultValue={filters.store_id ?? ''}>
              <option value="">All</option>
              {stores?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm">Category</label>
            <select className="w-full rounded-md border px-2 py-2" name="category_id" defaultValue={filters.category_id ?? ''}>
              <option value="">All</option>
              {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 flex items-end">
            <Button type="submit">Filter</Button>
          </div>
          <div>
            <label className="mb-1 block text-sm">Sort By</label>
            <select className="w-full rounded-md border px-2 py-2" name="sort_by" defaultValue={filters.sort_by ?? 'created_at'}>
              <option value="created_at">Created</option>
              <option value="price">Price</option>
              <option value="name">Name</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm">Direction</label>
            <select className="w-full rounded-md border px-2 py-2" name="sort_dir" defaultValue={filters.sort_dir ?? 'desc'}>
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </form>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3 md:grid-cols-6">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm">Store</label>
            <select className="w-full rounded-md border px-2 py-2" value={String(storeId)} onChange={(e) => setStoreId(Number(e.target.value))}>
              {stores?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm">Category</label>
            <select className="w-full rounded-md border px-2 py-2" value={String(categoryId)} onChange={(e) => setCategoryId(Number(e.target.value))}>
              {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm">Brand (optional)</label>
            <select className="w-full rounded-md border px-2 py-2" value={String(brandId)} onChange={(e) => setBrandId(Number(e.target.value))}>
              <option value={0}>None</option>
              {brands?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm">Name</label>
            <Input
              value={name}
              onChange={(e) => {
                const v = e.target.value;
                setName(v);
                if (!slug || slug === slugify(name)) setSlug(slugify(v));
              }}
              placeholder="MOSFET XYZ"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Slug</label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="mosfet-xyz" />
          </div>
          <div>
            <label className="mb-1 block text-sm">SKU</label>
            <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU-0001" />
          </div>
          <div>
            <label className="mb-1 block text-sm">Price</label>
            <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="10.00" />
          </div>
          <div className="md:col-span-6">
            <Button type="submit">Add</Button>
          </div>
        </form>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Thumb</TableHead>
                <TableHead>Meta</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.slug}</TableCell>
                  <TableCell>{p.sku}</TableCell>
                  <TableCell>${p.price}</TableCell>
                  <TableCell>
                    {p.thumb ? <img src={p.thumb} alt="" className="h-8 w-8 rounded object-cover" /> : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {p.store?.name && <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">{p.store.name}</span>}
                      {p.category?.name && <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">{p.category.name}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/admin/products/${p.id}`}>Manage</a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {pagination && (
          <div className="flex items-center justify-between">
            <div className="text-sm">Page {pagination.current_page} of {pagination.last_page} • Total {pagination.total}</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={pagination.current_page <= 1} onClick={() => goto(pagination.current_page - 1)}>Prev</Button>
              <Button size="sm" variant="outline" disabled={pagination.current_page >= pagination.last_page} onClick={() => goto(pagination.current_page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </AppLayout>
  );
}
