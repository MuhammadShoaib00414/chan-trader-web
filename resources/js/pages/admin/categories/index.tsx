import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { delJson, patchForm, postForm } from '@/lib/http';

export default function CategoriesIndex() {
  type CategoryItem = { id: number; name: string; slug: string; sort_order: number; is_active: boolean; icon?: string | null };
  type Pagination = { total: number; per_page: number; current_page: number; last_page: number };
  type PageProps = { items: CategoryItem[]; pagination?: Pagination; filters?: { q?: string } };
  const { props } = usePage<PageProps>();
  const items = props.items;
  const pagination = props.pagination;
  const [query, setQuery] = useState<string>(props.filters?.q ?? '');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState<{ name: string; slug: string; is_active: boolean; iconFile?: File | null }>({
    name: '',
    slug: '',
    is_active: true,
    iconFile: null,
  });
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [deleting, setDeleting] = useState<CategoryItem | null>(null);

  const resetForm = () => setForm({ name: '', slug: '', is_active: true, iconFile: null });

  const addCategory = async () => {
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('slug', form.slug);
    fd.append('is_active', form.is_active ? '1' : '0');
    if (form.iconFile) fd.append('icon', form.iconFile);
    const res = await postForm('/api/admin/categories', fd);
    if (res.ok) {
      resetForm();
      setAddOpen(false);
      router.reload({ only: ['items', 'pagination'] });
    }
  };

  const startEdit = (c: CategoryItem) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, is_active: c.is_active, iconFile: null });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('slug', form.slug);
    fd.append('is_active', form.is_active ? '1' : '0');
    if (form.iconFile) fd.append('icon', form.iconFile);
    const res = await patchForm(`/api/admin/categories/${editing.id}`, fd);
    if (res.ok) {
      setEditOpen(false);
      setEditing(null);
      resetForm();
      router.reload({ only: ['items'] });
    }
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
      router.reload({ only: ['items', 'pagination'] });
    }
  };

  const changePage = (page: number) => {
    router.get('/admin/categories', { page }, { preserveScroll: true, preserveState: true });
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
            <Button variant="outline" size="sm" onClick={() => router.get('/admin/categories', { q: query }, { preserveScroll: true, preserveState: true })}>
              Search
            </Button>
            {query && (
              <Button variant="ghost" size="sm" onClick={() => { setQuery(''); router.get('/admin/categories', {}, { preserveScroll: true, preserveState: true })}}>
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
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Resistors" />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Slug</label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="resistors" />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: !!v })} />
                  <span className="text-sm">Active</span>
                </div>
                <div>
                  <label className="mb-1 block text-sm">Icon</label>
                  <Input type="file" accept=".png,.jpg,.jpeg,.svg" onChange={(e) => setForm({ ...form, iconFile: e.target.files?.[0] ?? null })} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={addCategory}>Save</Button>
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
                <TableHead className="text-xs uppercase tracking-wide">Active</TableHead>
                <TableHead className="text-xs uppercase tracking-wide">Icon</TableHead>
                <TableHead className="w-28 text-right text-xs uppercase tracking-wide">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/20">
                  <TableCell>{c.id}</TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.slug}</TableCell>
                  <TableCell>
                    <Badge variant={c.is_active ? 'secondary' : 'outline'}>
                      {c.is_active ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {c.icon ? (
                      <img src={`/storage/${c.icon}`} alt={c.name} className="size-8 rounded-md border object-cover" />
                    ) : (
                      <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(c)}
                      title="Edit"
                      className="rounded-full border bg-blue-50 text-blue-600 hover:bg-blue-100"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startDelete(c)}
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
              No categories found.
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
              <DialogTitle>Edit Category</DialogTitle>
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
              <div className="flex items-center gap-2">
                <Checkbox checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: !!v })} />
                <span className="text-sm">Active</span>
              </div>
              <div>
                <label className="mb-1 block text-sm">Icon</label>
                <Input type="file" accept=".png,.jpg,.jpeg,.svg" onChange={(e) => setForm({ ...form, iconFile: e.target.files?.[0] ?? null })} />
                {editing?.icon && (
                  <div className="mt-2">
                    <img src={`/storage/${editing.icon}`} alt={editing.name} className="size-10 rounded-md border object-cover" />
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
    </AppLayout>
  );
}
