import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { postJson, patchJson, delJson } from '@/lib/http';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pencil, Trash2, Plus } from 'lucide-react';

export default function BrandsIndex() {
  type BrandItem = { id: number; name: string; slug: string };
  type Pagination = { total: number; per_page: number; current_page: number; last_page: number };
  type PageProps = { items: BrandItem[]; pagination?: Pagination; filters?: { q?: string } };
  const { props } = usePage<PageProps>();
  const items = props.items;
  const pagination = props.pagination;
  const [query, setQuery] = useState<string>(props.filters?.q ?? '');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState<{ name: string; slug: string }>({ name: '', slug: '' });
  const [editing, setEditing] = useState<BrandItem | null>(null);
  const [deleting, setDeleting] = useState<BrandItem | null>(null);

  const resetForm = () => setForm({ name: '', slug: '' });

  const addBrand = async () => {
    const res = await postJson('/api/admin/brands', { name: form.name, slug: form.slug });
    if (res.ok) {
      resetForm();
      setAddOpen(false);
      router.reload({ only: ['items', 'pagination'] });
    }
  };

  const startEdit = (b: BrandItem) => {
    setEditing(b);
    setForm({ name: b.name, slug: b.slug });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const res = await patchJson(`/api/admin/brands/${editing.id}`, { name: form.name, slug: form.slug });
    if (res.ok) {
      setEditOpen(false);
      setEditing(null);
      resetForm();
      router.reload({ only: ['items'] });
    }
  };

  const startDelete = (b: BrandItem) => {
    setDeleting(b);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const res = await delJson(`/api/admin/brands/${deleting.id}`);
    if (res.ok) {
      setDeleteOpen(false);
      setDeleting(null);
      router.reload({ only: ['items', 'pagination'] });
    }
  };

  const changePage = (page: number) => {
    router.get('/admin/brands', { page }, { preserveScroll: true, preserveState: true });
  };

  const canPrev = useMemo(() => (pagination ? pagination.current_page > 1 : false), [pagination]);
  const canNext = useMemo(() => (pagination ? pagination.current_page < pagination.last_page : false), [pagination]);

  return (
    <AppLayout breadcrumbs={[{ title: 'Brands', href: '/admin/brands' }]}>
      <Head title="Brands" />
      <div className="grid gap-6 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search brands..."
              className="w-[240px]"
            />
            <Button variant="outline" size="sm" onClick={() => router.get('/admin/brands', { q: query }, { preserveScroll: true, preserveState: true })}>
              Search
            </Button>
            {query && (
              <Button variant="ghost" size="sm" onClick={() => { setQuery(''); router.get('/admin/brands', {}, { preserveScroll: true, preserveState: true })}}>
                Clear
              </Button>
            )}
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="mr-2 size-4" /> Add Brand
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Brand</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <div>
                  <label className="mb-1 block text-sm">Name</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Texas Instruments" />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Slug</label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="texas-instruments" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={addBrand}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-12 text-xs uppercase tracking-wide">ID</TableHead>
                <TableHead className="text-xs uppercase tracking-wide">Name</TableHead>
                <TableHead className="text-xs uppercase tracking-wide">Slug</TableHead>
                <TableHead className="w-28 text-right text-xs uppercase tracking-wide">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map((b) => (
                <TableRow key={b.id} className="hover:bg-muted/20">
                  <TableCell>{b.id}</TableCell>
                  <TableCell>{b.name}</TableCell>
                  <TableCell>{b.slug}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(b)}
                      title="Edit"
                      className="rounded-full border bg-blue-50 text-blue-600 hover:bg-blue-100"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startDelete(b)}
                      title="Delete"
                      className="rounded-full border bg-rose-50 text-rose-600 hover:bg-rose-100"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(!items || items.length === 0) && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No brands found.
            </div>
          )}
          {pagination && (
            <div className="flex items-center justify-between p-3">
              <div className="text-sm text-muted-foreground">
                Page {pagination.current_page} of {pagination.last_page} · Total {pagination.total}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={!canPrev} onClick={() => changePage((pagination?.current_page ?? 1) - 1)}>
                  Prev
                </Button>
                <Button variant="outline" size="sm" disabled={!canNext} onClick={() => changePage((pagination?.current_page ?? 1) + 1)}>
                  Next
                </Button>
                {Array.from({ length: Math.min(pagination.last_page, 8) }, (_, i) => i + 1).map((n) => (
                  <Button
                    key={n}
                    variant={n === pagination.current_page ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-full"
                    onClick={() => changePage(n)}
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Dialog open={editOpen} onOpenChange={(o) => setEditOpen(o)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Brand</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <label className="mb-1 block text-sm">Name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm">Slug</label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
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
              <DialogTitle>Delete Brand</DialogTitle>
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
    </AppLayout>
  );
}
