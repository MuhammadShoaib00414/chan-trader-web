import AppLayout from '@/layouts/app-layout'
import { Head, router, usePage } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { delJson, patchForm, postForm } from '@/lib/http'
import { ToastStack } from '@/components/ui/toast-stack'
import { Pencil, Plus, Trash2 } from 'lucide-react'

export default function PromotionsIndex() {
  type ProductRef = { id: number; name: string }
  type PromotionItem = { id: number; product_id: number; image?: string | null; is_active: boolean; product?: { id: number; name: string } }
  type Pagination = { total: number; per_page: number; current_page: number; last_page: number }
  type PageProps = { items: PromotionItem[]; products: ProductRef[]; pagination?: Pagination; filters?: { q?: string } }

  const { props } = usePage<PageProps>()
  const items = props.items ?? []
  const products = props.products ?? []
  const pagination = props.pagination
  const [query, setQuery] = useState(props.filters?.q ?? '')

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [editing, setEditing] = useState<PromotionItem | null>(null)
  const [deleting, setDeleting] = useState<PromotionItem | null>(null)

  const [form, setForm] = useState<{ product_id: string; is_active: boolean; imageFile?: File | null }>({
    product_id: products?.[0]?.id ? String(products[0].id) : '',
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
      product_id: products?.[0]?.id ? String(products[0].id) : '',
      is_active: true,
      imageFile: null,
    })

  const applyFilters = (extra?: Record<string, unknown>) => {
    router.get('/admin/promotions', { q: query || undefined, ...(extra ?? {}) }, { preserveScroll: true, preserveState: true })
  }

  useEffect(() => {
    setQuery(props.filters?.q ?? '')
  }, [props.filters])

  const canPrev = useMemo(() => (pagination ? pagination.current_page > 1 : false), [pagination])
  const canNext = useMemo(() => (pagination ? pagination.current_page < pagination.last_page : false), [pagination])

  const addPromotion = async () => {
    const fd = new FormData()
    fd.append('product_id', form.product_id)
    fd.append('is_active', form.is_active ? '1' : '0')
    if (form.imageFile) fd.append('image', form.imageFile)
    const res = await postForm('/api/admin/promotions', fd)
    if (res.ok) {
      try {
        const data = (await res.json()) as any
        showToast(data?.message ?? 'Promotion created.', 'success')
      } catch {
        showToast('Promotion created.', 'success')
      }
      resetForm()
      setAddOpen(false)
      applyFilters({ page: pagination?.current_page ?? 1 })
      return
    }
    showToast(await errorMessageFromResponse(res), 'error')
  }

  const startEdit = (p: PromotionItem) => {
    setEditing(p)
    setForm({ product_id: String(p.product_id), is_active: p.is_active, imageFile: null })
    setEditOpen(true)
  }

  const saveEdit = async () => {
    if (!editing) return
    const fd = new FormData()
    fd.append('product_id', form.product_id)
    fd.append('is_active', form.is_active ? '1' : '0')
    if (form.imageFile) fd.append('image', form.imageFile)
    const res = await patchForm(`/api/admin/promotions/${editing.id}`, fd)
    if (res.ok) {
      try {
        const data = (await res.json()) as any
        showToast(data?.message ?? 'Promotion updated.', 'success')
      } catch {
        showToast('Promotion updated.', 'success')
      }
      setEditOpen(false)
      setEditing(null)
      resetForm()
      applyFilters({ page: pagination?.current_page ?? 1 })
      return
    }
    showToast(await errorMessageFromResponse(res), 'error')
  }

  const startDelete = (p: PromotionItem) => {
    setDeleting(p)
    setDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    const res = await delJson(`/api/admin/promotions/${deleting.id}`)
    if (res.ok) {
      try {
        const data = (await res.json()) as any
        showToast(data?.message ?? 'Promotion deleted.', 'success')
      } catch {
        showToast('Promotion deleted.', 'success')
      }
      setDeleteOpen(false)
      setDeleting(null)
      applyFilters({ page: pagination?.current_page ?? 1 })
      return
    }
    showToast(await errorMessageFromResponse(res), 'error')
  }

  return (
    <AppLayout breadcrumbs={[{ title: 'Promotions', href: '/admin/promotions' }]}>
      <Head title="Promotions" />

      <div className="grid gap-6 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by product name..." className="w-[260px]" />
            <Button variant="outline" size="sm" onClick={() => applyFilters({ page: 1 })}>
              Search
            </Button>
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery('')
                  applyFilters({ q: undefined, page: 1 })
                }}
              >
                Clear
              </Button>
            )}
          </div>

          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="mr-2 size-4" /> Add Promotion
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Promotion</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <div>
                  <label className="mb-1 block text-sm">Product</label>
                  <select
                    className="w-full rounded-md border px-2 py-2"
                    value={form.product_id}
                    onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
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
                <Button onClick={addPromotion}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-xl border bg-card shadow-md">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-16 text-xs uppercase tracking-wide">ID</TableHead>
                <TableHead className="text-xs uppercase tracking-wide">Product</TableHead>
                <TableHead className="text-xs uppercase tracking-wide">Active</TableHead>
                <TableHead className="text-xs uppercase tracking-wide">Image</TableHead>
                <TableHead className="w-28 text-right text-xs uppercase tracking-wide">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/20">
                  <TableCell>{p.id}</TableCell>
                  <TableCell>{p.product?.name ?? `#${p.product_id}`}</TableCell>
                  <TableCell>{p.is_active ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    {p.image ? (
                      <img src={`/storage/${p.image}`} alt="" className="size-10 rounded-md border object-cover" />
                    ) : (
                      <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Edit"
                      className="rounded-full border bg-blue-50 text-blue-600 hover:bg-blue-100"
                      onClick={() => startEdit(p)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete"
                      className="rounded-full border bg-rose-50 text-rose-600 hover:bg-rose-100"
                      onClick={() => startDelete(p)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(!items || items.length === 0) && <div className="p-8 text-center text-sm text-muted-foreground">No promotions found.</div>}

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
              <DialogTitle>Edit Promotion</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <label className="mb-1 block text-sm">Product</label>
                <select className="w-full rounded-md border px-2 py-2" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
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
                    <img src={`/storage/${editing.image}`} alt="" className="size-12 rounded-md border object-cover" />
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
              <DialogTitle>Delete Promotion</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this promotion for “{deleting?.product?.name ?? `#${deleting?.product_id}` }”?
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

