import AppLayout from '@/layouts/app-layout'
// Refresh module
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search subcategories..."
                className="w-full"
              />
            </div>
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => applyFilters({ page: 1 })}>
                Search
              </Button>
              {(query || categoryId) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 sm:flex-none"
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
          </div>

          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto" onClick={() => setAddOpen(true)}>
                <Plus className="mr-2 size-4" /> Add Subcategory
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-lg overflow-y-auto max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Add Subcategory</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Category</label>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })}
                    placeholder="Ceramic capacitors"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Slug</label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="ceramic-capacitors" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Order</label>
                  <Input type="number" placeholder="Auto" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
                </div>
                <div className="flex items-center gap-3 p-2 rounded-md border bg-muted/20">
                  <Checkbox id="is_active" checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: !!v })} />
                  <label htmlFor="is_active" className="text-sm font-medium cursor-pointer">Mark as Active</label>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Image</label>
                  <Input
                    type="file"
                    className="cursor-pointer"
                    accept=".png,.jpg,.jpeg,.webp,.svg"
                    onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] ?? null })}
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button onClick={addSubcategory}>Save Subcategory</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="hidden md:block w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-16">
                  <button type="button" className="flex items-center gap-1 font-semibold" onClick={() => toggleSort('id')}>
                    ID {sortBy === 'id' ? (sortDir === 'asc' ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />) : <ArrowUpDown className="size-3" />}
                  </button>
                </TableHead>
                <TableHead>
                  <button type="button" className="flex items-center gap-1 font-semibold" onClick={() => toggleSort('name')}>
                    Name {sortBy === 'name' ? (sortDir === 'asc' ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />) : <ArrowUpDown className="size-3" />}
                  </button>
                </TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead>
                  <button type="button" className="flex items-center gap-1 font-semibold" onClick={() => toggleSort('is_active')}>
                    Status {sortBy === 'is_active' ? (sortDir === 'asc' ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />) : <ArrowUpDown className="size-3" />}
                  </button>
                </TableHead>
                <TableHead className="text-center">
                  <button type="button" className="flex items-center justify-center gap-1 w-full font-semibold" onClick={() => toggleSort('sort_order')}>
                    Order {sortBy === 'sort_order' ? (sortDir === 'asc' ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />) : <ArrowUpDown className="size-3" />}
                  </button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((s) => (
                <TableRow key={s.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium text-muted-foreground">{s.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg border bg-muted/10 flex items-center justify-center overflow-hidden shrink-0">
                        {s.image ? (
                          <img src={`/storage/${s.image}`} alt={s.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-bold uppercase">{s.name.substring(0, 2)}</span>
                        )}
                      </div>
                      <span className="font-semibold">{s.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                      {s.category?.name ?? `#${s.category_id}`}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.is_active ? 'secondary' : 'destructive'} className={s.is_active ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20' : ''}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs">{s.sort_order ?? '0'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-blue-50 hover:text-blue-600" onClick={() => startEdit(s)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-rose-50 hover:text-rose-600" onClick={() => startDelete(s)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>

          {/* Mobile Grid View */}
          <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
            {items.map((s) => (
              <div key={s.id} className="rounded-xl border bg-card p-4 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg border bg-muted/10 flex items-center justify-center overflow-hidden shrink-0">
                    {s.image ? (
                      <img src={`/storage/${s.image}`} alt={s.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs text-muted-foreground font-bold uppercase">{s.name.substring(0, 2)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-base truncate">{s.name}</div>
                    <div className="text-xs text-muted-foreground">ID: #{s.id}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Category</div>
                    <div className="font-medium truncate">{s.category?.name ?? 'N/A'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Status</div>
                    <Badge variant={s.is_active ? 'secondary' : 'outline'} className={s.is_active ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : ''}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-xs font-medium text-muted-foreground">Order: {s.sort_order ?? '0'}</div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => startEdit(s)}>
                      <Pencil className="mr-2 size-3" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 px-3 text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-100" onClick={() => startDelete(s)}>
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {(!items || items.length === 0) && (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No subcategories found</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                Try adjusting your search or filters to find what you're looking for.
              </p>
            </div>
          )}

          {pagination && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-muted/5">
              <div className="text-sm text-muted-foreground order-2 sm:order-1">
                Showing <span className="font-medium">{(pagination.current_page - 1) * pagination.per_page + 1}</span> to <span className="font-medium">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> subcategories
              </div>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <Button variant="outline" size="sm" disabled={!canPrev} onClick={() => applyFilters({ page: (pagination?.current_page ?? 1) - 1 })}>
                  Previous
                </Button>
                <div className="flex items-center justify-center min-w-[80px] text-sm font-medium">
                  Page {pagination.current_page} of {pagination.last_page}
                </div>
                <Button variant="outline" size="sm" disabled={!canNext} onClick={() => applyFilters({ page: (pagination?.current_page ?? 1) + 1 })}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Edit Subcategory</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Category</label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Slug</label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Order</label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
              </div>
              <div className="flex items-center gap-3 p-2 rounded-md border bg-muted/20">
                <Checkbox id="edit_is_active" checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: !!v })} />
                <label htmlFor="edit_is_active" className="text-sm font-medium cursor-pointer">Subcategory is Active</label>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Image</label>
                <div className="flex items-center gap-4">
                  {editing?.image && (
                    <div className="shrink-0 h-16 w-16 rounded-lg border overflow-hidden">
                      <img src={`/storage/${editing.image}`} alt={editing.name} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <Input
                    type="file"
                    className="cursor-pointer"
                    accept=".png,.jpg,.jpeg,.webp,.svg"
                    onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] ?? null })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={saveEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="max-w-[90vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-rose-600">Delete Subcategory</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-foreground">“{deleting?.name}”</span>?
                This action is permanent and cannot be undone. All linked products will lose this subcategory.
              </p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Keep it
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Yes, Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </AppLayout>
  )
}

