import AppLayout from '@/layouts/app-layout'
import { Head, router, usePage } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { delJson, patchForm, postForm } from '@/lib/http'
import { ToastStack } from '@/components/ui/toast-stack'
import { ArrowUpDown, ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from 'lucide-react'

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')

export default function SubcategoriesIndex() {
  type CategoryRef = { id: number; name: string }
  type SubcategoryItem = {
    id: number
    category_id: number
    name: string
    slug: string
    sort_order: number | null
    is_active: boolean
    image?: string | null
    category?: { id: number; name: string } | null
  }
  type Pagination = { total: number; per_page: number; current_page: number; last_page: number }
  type PageProps = {
    items: SubcategoryItem[]
    categories: CategoryRef[]
    pagination?: Pagination
    filters?: { q?: string; category_id?: string | number; sort_by?: string; sort_dir?: 'asc' | 'desc' }
  }

  const { props } = usePage<PageProps>()
  const items = props.items ?? []
  const categories = props.categories ?? []
  const pagination = props.pagination

  const [query, setQuery] = useState<string>(props.filters?.q ?? '')
  const [categoryId, setCategoryId] = useState<string>(props.filters?.category_id ? String(props.filters.category_id) : '')
  const [sortBy, setSortBy] = useState<string>(props.filters?.sort_by ?? 'sort_order')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(props.filters?.sort_dir ?? 'asc')

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [editing, setEditing] = useState<SubcategoryItem | null>(null)
  const [deleting, setDeleting] = useState<SubcategoryItem | null>(null)

  const [form, setForm] = useState<{
    category_id: string
    name: string
    slug: string
    sort_order: string
    is_active: boolean
    imageFile?: File | null
  }>({
    category_id: categories?.[0]?.id ? String(categories[0].id) : '',
    name: '',
    slug: '',
    sort_order: '',
    is_active: true,
    imageFile: null,
  })

  const [toasts, setToasts] = useState<Array<{ id: number; title: string; variant: 'success' | 'error' }>>([])
  const dismissToast = (id: number) => setToasts((ts) => ts.filter((t) => t.id !== id))
  const showToast = (title: string, variant: 'success' | 'error' = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((ts) => [...ts, { id, title, variant }])
    setTimeout(() => dismissToast(id), 2500)
  }

  const errorMessageFromResponse = async (res: Response): Promise<string> => {
    try {
      const data = (await res.json()) as any
      if (data?.message && typeof data.message === 'string') return data.message
      const firstError = data?.errors ? Object.values<any>(data.errors)?.flat()?.[0] : null
      if (firstError && typeof firstError === 'string') return firstError
      return `Request failed (${res.status}).`
    } catch {
      return `Request failed (${res.status}).`
    }
  }

  const resetForm = () =>
    setForm({
      category_id: categories?.[0]?.id ? String(categories[0].id) : '',
      name: '',
      slug: '',
      sort_order: '',
      is_active: true,
      imageFile: null,
    })

  const applyFilters = (extra?: Record<string, unknown>) => {
    router.get(
      '/admin/subcategories',
      {
        q: query || undefined,
        category_id: categoryId || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
        ...(extra ?? {}),
      },
      { preserveScroll: true, preserveState: true }
    )
  }

  const toggleSort = (key: string) => {
    if (sortBy === key) {
      const dir = sortDir === 'asc' ? 'desc' : 'asc'
      setSortDir(dir)
      applyFilters({ page: 1, sort_dir: dir, sort_by: key })
    } else {
      setSortBy(key)
      setSortDir('asc')
      applyFilters({ page: 1, sort_dir: 'asc', sort_by: key })
    }
  }

  useEffect(() => {
    setQuery(props.filters?.q ?? '')
    setCategoryId(props.filters?.category_id ? String(props.filters.category_id) : '')
    setSortBy(props.filters?.sort_by ?? 'sort_order')
    setSortDir((props.filters?.sort_dir as 'asc' | 'desc') ?? 'asc')
  }, [props.filters])

  const addSubcategory = async () => {
    const fd = new FormData()
    fd.append('category_id', form.category_id)
    fd.append('name', form.name)
    fd.append('slug', form.slug)
    fd.append('is_active', form.is_active ? '1' : '0')
    if (form.sort_order) fd.append('sort_order', form.sort_order)
    if (form.imageFile) fd.append('image', form.imageFile)
    const res = await postForm('/api/admin/subcategories', fd)
    if (res.ok) {
      resetForm()
      setAddOpen(false)
      try {
        const data = (await res.json()) as any
        showToast(data?.message ?? 'Subcategory created.', 'success')
      } catch {
        showToast('Subcategory created.', 'success')
      }
      applyFilters({ page: pagination?.current_page ?? 1 })
      return
    }
    showToast(await errorMessageFromResponse(res), 'error')
  }

  const startEdit = (s: SubcategoryItem) => {
    setEditing(s)
    setForm({
      category_id: String(s.category_id),
      name: s.name,
      slug: s.slug,
      sort_order: s.sort_order ? String(s.sort_order) : '',
      is_active: s.is_active,
      imageFile: null,
    })
    setEditOpen(true)
  }

  const saveEdit = async () => {
    if (!editing) return
    const fd = new FormData()
    fd.append('category_id', form.category_id)
    fd.append('name', form.name)
    fd.append('slug', form.slug)
    fd.append('is_active', form.is_active ? '1' : '0')
    if (form.sort_order) fd.append('sort_order', form.sort_order)
    if (form.imageFile) fd.append('image', form.imageFile)
    const res = await patchForm(`/api/admin/subcategories/${editing.id}`, fd)
    if (res.ok) {
      setEditOpen(false)
      setEditing(null)
      resetForm()
      try {
        const data = (await res.json()) as any
        showToast(data?.message ?? 'Subcategory updated.', 'success')
      } catch {
        showToast('Subcategory updated.', 'success')
      }
      applyFilters({ page: pagination?.current_page ?? 1 })
      return
    }
    showToast(await errorMessageFromResponse(res), 'error')
  }

  const startDelete = (s: SubcategoryItem) => {
    setDeleting(s)
    setDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    const res = await delJson(`/api/admin/subcategories/${deleting.id}`)
    if (res.ok) {
      setDeleteOpen(false)
      setDeleting(null)
      try {
        const data = (await res.json()) as any
        showToast(data?.message ?? 'Subcategory deleted.', 'success')
      } catch {
        showToast('Subcategory deleted.', 'success')
      }
      applyFilters({ page: pagination?.current_page ?? 1 })
      return
    }
    showToast(await errorMessageFromResponse(res), 'error')
  }

  const canPrev = useMemo(() => (pagination ? pagination.current_page > 1 : false), [pagination])
  const canNext = useMemo(() => (pagination ? pagination.current_page < pagination.last_page : false), [pagination])

  return (
    <AppLayout breadcrumbs={[{ title: 'Subcategories', href: '/admin/subcategories' }]}>
      <Head title="Subcategories" />

      <div className="grid gap-6 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search subcategories..." className="w-[240px]" />
            <select className="h-9 rounded-md border bg-background px-2 text-sm" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={() => applyFilters({ page: 1 })}>
              Search
            </Button>
            {(query || categoryId) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery('')
                  setCategoryId('')
                  applyFilters({ q: undefined, category_id: undefined, page: 1 })
                }}
              >
                Clear
              </Button>
            )}
          </div>

          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="mr-2 size-4" /> Add Subcategory
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Subcategory</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <div>
                  <label className="mb-1 block text-sm">Category</label>
                  <select className="w-full rounded-md border px-2 py-2" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm">Name</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })} placeholder="Ceramic capacitors" />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Slug</label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="ceramic-capacitors" />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Order</label>
                  <Input type="number" placeholder="Auto" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: !!v })} />
                  <span className="text-sm">Active</span>
                </div>
                <div>
                  <label className="mb-1 block text-sm">Image</label>
                  <Input type="file" accept=".png,.jpg,.jpeg,.webp,.svg" onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] ?? null })} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={addSubcategory}>Save</Button>
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
                <TableHead className="text-xs uppercase tracking-wide">Category</TableHead>
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
              {items.map((s, i) => (
                <TableRow key={s.id} className={i % 2 === 1 ? 'bg-muted/10 hover:bg-muted/20' : 'hover:bg-muted/20'}>
                  <TableCell>{s.id}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.category?.name ?? `#${s.category_id}`}</TableCell>
                  <TableCell>
                    <Badge variant={s.is_active ? 'secondary' : 'outline'}>{s.is_active ? 'Enabled' : 'Disabled'}</Badge>
                  </TableCell>
                  <TableCell>{s.sort_order ?? ''}</TableCell>
                  <TableCell>
                    {s.image ? <img src={`/storage/${s.image}`} alt={s.name} className="size-8 rounded-md border object-cover" /> : <span className="text-xs text-muted-foreground">None</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" title="Edit" className="rounded-full border bg-blue-50 text-blue-600 hover:bg-blue-100" onClick={() => startEdit(s)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Delete" className="rounded-full border bg-rose-50 text-rose-600 hover:bg-rose-100" onClick={() => startDelete(s)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(!items || items.length === 0) && <div className="p-8 text-center text-sm text-muted-foreground">No subcategories found.</div>}

          {pagination && (
            <div className="flex items-center justify-between p-3">
              <div className="text-sm text-muted-foreground">
                Page {pagination.current_page} of {pagination.last_page} · Total {pagination.total}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={!canPrev} onClick={() => applyFilters({ page: (pagination?.current_page ?? 1) - 1 })}>
                  Prev
                </Button>
                <Button variant="outline" size="sm" disabled={!canNext} onClick={() => applyFilters({ page: (pagination?.current_page ?? 1) + 1 })}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Subcategory</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <label className="mb-1 block text-sm">Category</label>
                <select className="w-full rounded-md border px-2 py-2" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
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
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: !!v })} />
                <span className="text-sm">Active</span>
              </div>
              <div>
                <label className="mb-1 block text-sm">Image</label>
                <Input type="file" accept=".png,.jpg,.jpeg,.webp,.svg" onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] ?? null })} />
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

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Subcategory</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete “{deleting?.name}”? This action cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </AppLayout>
  )
}

