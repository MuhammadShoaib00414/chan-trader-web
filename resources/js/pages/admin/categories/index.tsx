import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Trash2, Plus, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { delJson, patchForm, postForm } from '@/lib/http';
import { ToastStack } from '@/components/ui/toast-stack';
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

export default function CategoriesIndex() {
  type CategoryItem = { id: number; name: string; slug: string; sort_order: number; is_active: boolean; image?: string | null };
  type Pagination = { total: number; per_page: number; current_page: number; last_page: number };
  type PageProps = { items: CategoryItem[]; pagination?: Pagination; filters?: { q?: string; sort_by?: string; sort_dir?: 'asc' | 'desc' } };
  const { props } = usePage<PageProps>();
  const items = props.items;
  const pagination = props.pagination;
  const [query, setQuery] = useState<string>(props.filters?.q ?? '');
  const [sortBy, setSortBy] = useState<string>(props.filters?.sort_by ?? 'sort_order');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(props.filters?.sort_dir ?? 'asc');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState<{ name: string; slug: string; sort_order: string; is_active: boolean; imageFile?: File | null }>({
    name: '',
    slug: '',
    sort_order: '',
    is_active: true,
    imageFile: null,
  });
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [deleting, setDeleting] = useState<CategoryItem | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: number; title: string; variant: 'success' | 'error' }>>([]);

  const resetForm = () => setForm({ name: '', slug: '', sort_order: '', is_active: true, imageFile: null });

  const dismissToast = (id: number) => setToasts((ts) => ts.filter((t) => t.id !== id));

  const showToast = (title: string, variant: 'success' | 'error' = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((ts) => [...ts, { id, title, variant }]);
    setTimeout(() => {
      dismissToast(id);
    }, 2500);
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

  const applyFilters = (extra?: Record<string, unknown>) => {
    router.get(
      '/admin/categories',
      { q: query || undefined, sort_by: sortBy, sort_dir: sortDir, ...(extra ?? {}) },
      { preserveScroll: true, preserveState: true }
    );
  };

  const toggleSort = (key: string) => {
    if (sortBy === key) {
      const dir = sortDir === 'asc' ? 'desc' : 'asc';
      setSortDir(dir);
      applyFilters({ page: 1, sort_dir: dir, sort_by: key });
    } else {
      setSortBy(key);
      setSortDir('asc');
      applyFilters({ page: 1, sort_dir: 'asc', sort_by: key });
    }
  };

  useEffect(() => {
    setQuery(props.filters?.q ?? '');
    setSortBy(props.filters?.sort_by ?? 'sort_order');
    setSortDir((props.filters?.sort_dir as 'asc' | 'desc') ?? 'asc');
  }, [props.filters]);

  const displaySortOrder = (c: CategoryItem, i: number) => {
    if (c.sort_order && c.sort_order > 0) return c.sort_order;
    return (pagination?.per_page ?? 20) * ((pagination?.current_page ?? 1) - 1) + i + 1;
  };

  const addCategory = async () => {
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('slug', form.slug);
    fd.append('is_active', form.is_active ? '1' : '0');
    if (form.sort_order) fd.append('sort_order', form.sort_order);
    if (form.imageFile) fd.append('image', form.imageFile);
    const res = await postForm('/api/admin/categories', fd);
    if (res.ok) {
      resetForm();
      setAddOpen(false);
      try {
        const data = (await res.json()) as any;
        showToast(data?.message ?? 'Category created.', 'success');
      } catch {
        showToast('Category created.', 'success');
      }
      applyFilters({ page: pagination?.current_page ?? 1 });
      return;
    }
    showToast(await errorMessageFromResponse(res), 'error');
  };

  const startEdit = (c: CategoryItem, shownSortOrder: number) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, sort_order: String(shownSortOrder), is_active: c.is_active, imageFile: null });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('slug', form.slug);
    fd.append('is_active', form.is_active ? '1' : '0');
    if (form.sort_order) fd.append('sort_order', form.sort_order);
    if (form.imageFile) fd.append('image', form.imageFile);
    const res = await patchForm(`/api/admin/categories/${editing.id}`, fd);
    if (res.ok) {
      setEditOpen(false);
      setEditing(null);
      resetForm();
      try {
        const data = (await res.json()) as any;
        showToast(data?.message ?? 'Category updated.', 'success');
      } catch {
        showToast('Category updated.', 'success');
      }
      applyFilters({ page: pagination?.current_page ?? 1 });
      return;
    }
    showToast(await errorMessageFromResponse(res), 'error');
  };

  const startDelete = (c: CategoryItem) => {
    setDeleting(c);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const res = await delJson(`/api/admin/categories/${deleting.id}`);
    if (res.ok) {
      setDeleteOpen(false);
      setDeleting(null);
      try {
        const data = (await res.json()) as any;
        showToast(data?.message ?? 'Category deleted.', 'success');
      } catch {
        showToast('Category deleted.', 'success');
      }
      applyFilters({ page: pagination?.current_page ?? 1 });
      return;
    }
    showToast(await errorMessageFromResponse(res), 'error');
  };

  const changePage = (page: number) => {
    applyFilters({ page });
  };

  const canPrev = useMemo(() => (pagination ? pagination.current_page > 1 : false), [pagination]);
  const canNext = useMemo(() => (pagination ? pagination.current_page < pagination.last_page : false), [pagination]);

  return (
    <AppLayout breadcrumbs={[{ title: 'Categories', href: '/admin/categories' }]}>
      <Head title="Categories" />
      <div className="grid gap-6 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories..."
              className="w-[240px]"
            />
            <Button variant="outline" size="sm" onClick={() => applyFilters({ page: 1 })}>
              Search
            </Button>
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery('');
                  applyFilters({ q: undefined, page: 1 });
                }}
              >
                Clear
              </Button>
            )}
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="mr-2 size-4" /> Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Category</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <div>
                  <label className="mb-1 block text-sm">Name</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })} placeholder="Resistors" />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Slug</label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="resistors" />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Order</label>
                  <Input
                    type="number"
                    placeholder="Auto"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: !!v })} />
                  <span className="text-sm">Active</span>
                </div>
                <div>
                  <label className="mb-1 block text-sm">Image</label>
                  <Input type="file" accept=".png,.jpg,.jpeg,.svg" onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] ?? null })} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={addCategory}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-xl border bg-card shadow-md">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-16 text-xs uppercase tracking-wide">
                  <button type="button" className="flex items-center gap-1 cursor-pointer" onClick={() => toggleSort('id')}>
                    ID {sortBy === 'id' ? (sortDir === 'asc' ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />) : <ArrowUpDown className="size-3" />}
                  </button>
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wide">
                  <button type="button" className="flex items-center gap-1 cursor-pointer" onClick={() => toggleSort('name')}>
                    Name {sortBy === 'name' ? (sortDir === 'asc' ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />) : <ArrowUpDown className="size-3" />}
                  </button>
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wide">
                  <button type="button" className="flex items-center gap-1 cursor-pointer" onClick={() => toggleSort('slug')}>
                    Slug {sortBy === 'slug' ? (sortDir === 'asc' ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />) : <ArrowUpDown className="size-3" />}
                  </button>
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wide">
                  <button type="button" className="flex items-center gap-1 cursor-pointer" onClick={() => toggleSort('is_active')}>
                    Active {sortBy === 'is_active' ? (sortDir === 'asc' ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />) : <ArrowUpDown className="size-3" />}
                  </button>
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wide">
                  <button type="button" className="flex items-center gap-1 cursor-pointer" onClick={() => toggleSort('sort_order')}>
                    Order {sortBy === 'sort_order' ? (sortDir === 'asc' ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />) : <ArrowUpDown className="size-3" />}
                  </button>
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wide">Image</TableHead>
                <TableHead className="w-28 text-right text-xs uppercase tracking-wide">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map((c, i) => (
                (() => {
                  const shownOrder = displaySortOrder(c, i);
                  return (
                <TableRow
                  key={c.id}
                  className={i % 2 === 1 ? 'bg-muted/10 hover:bg-muted/20 cursor-pointer' : 'hover:bg-muted/20 cursor-pointer'}
                  onClick={() => startEdit(c, shownOrder)}
                >
                  <TableCell>{c.id}</TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.slug}</TableCell>
                  <TableCell>
                    <Badge variant={c.is_active ? 'secondary' : 'outline'}>
                      {c.is_active ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {shownOrder}
                  </TableCell>
                  <TableCell>
                    {c.image ? (
                      <img src={`/storage/${c.image}`} alt={c.name} className="size-8 rounded-md border object-cover" />
                    ) : (
                      <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(c, shownOrder);
                      }}
                      title="Edit"
                      className="rounded-full border bg-blue-50 text-blue-600 hover:bg-blue-100"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        startDelete(c);
                      }}
                      title="Delete"
                      className="rounded-full border bg-rose-50 text-rose-600 hover:bg-rose-100"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                  );
                })()
              ))}
            </TableBody>
          </Table>
          {(!items || items.length === 0) && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No categories found.
            </div>
          )}
          {pagination && (
            <div className="flex items-center justify-between p-3">
              <div className="text-sm text-muted-foreground">
                Page {pagination.current_page} of {pagination.last_page} · Total {pagination.total}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={!canPrev} onClick={() => changePage((pagination?.current_page ?? 1) - 1)}>
                  Prev
                </Button>
                {(() => {
                  const pages: number[] = [];
                  const start = Math.max(1, (pagination?.current_page ?? 1) - 2);
                  const end = Math.min(pagination!.last_page, (pagination?.current_page ?? 1) + 2);
                  if (start > 1) pages.push(1);
                  for (let n = start; n <= end; n++) pages.push(n);
                  if (end < pagination!.last_page) pages.push(pagination!.last_page);
                  return pages;
                })().map((n, idx, arr) => {
                  const prev = idx > 0 ? arr[idx - 1] : null;
                  const isGap = prev !== null && n - prev! > 1;
                  return (
                    <div key={`${n}-${idx}`} className="flex items-center">
                      {isGap && <span className="px-1 text-muted-foreground">…</span>}
                      <Button variant={n === pagination!.current_page ? 'default' : 'outline'} size="sm" className="rounded-full" onClick={() => changePage(n)}>
                        {n}
                      </Button>
                    </div>
                  );
                })}
                <Button variant="outline" size="sm" disabled={!canNext} onClick={() => changePage((pagination?.current_page ?? 1) + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        <Dialog open={editOpen} onOpenChange={(o) => setEditOpen(o)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <label className="mb-1 block text-sm">Name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1 block text-sm">Slug</label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm">Order</label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: !!v })} />
                <span className="text-sm">Active</span>
              </div>
              <div>
                <label className="mb-1 block text-sm">Image</label>
                <Input type="file" accept=".png,.jpg,.jpeg,.svg" onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] ?? null })} />
                {editing?.image && (
                  <div className="mt-2">
                    <img src={`/storage/${editing.image}`} alt={editing.name} className="size-10 rounded-md border object-cover" />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={saveEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteOpen} onOpenChange={(o) => setDeleteOpen(o)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Category</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete “{deleting?.name}”? This action cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </AppLayout>
  );
}
