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
  type PromotionItem = { 
    id: number; 
    product_id: number; 
    name?: string | null;
    image?: string | null;
    title?: string | null;
    subtitle?: string | null;
    description?: string | null;
    button_text?: string | null;
    button_link?: string | null;
    is_active: boolean;
    start_date?: string | null;
    end_date?: string | null;
    start_datetime?: string | null;
    end_datetime?: string | null;
    order_number?: number;
    text_color?: string | null;
    background_color?: string | null;
    device_type?: 'web' | 'mobile';
    product?: { id: number; name: string } 
  }
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

  const [form, setForm] = useState<{
    product_id: string;
    name: string;
    title: string;
    subtitle: string;
    description: string;
    button_text: string;
    button_link: string;
    is_active: boolean;
    start_date: string;
    end_date: string;
    start_datetime: string;
    end_datetime: string;
    order_number: string;
    text_color: string;
    background_color: string;
    device_type: 'web' | 'mobile';
    imageFile?: File | null;
  }>({
    product_id: products?.[0]?.id ? String(products[0].id) : '',
    name: '',
    title: '',
    subtitle: '',
    description: '',
    button_text: '',
    button_link: '',
    is_active: true,
    start_date: '',
    end_date: '',
    start_datetime: '',
    end_datetime: '',
    order_number: '0',
    text_color: '',
    background_color: '',
    device_type: 'web',
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
      name: '',
      title: '',
      subtitle: '',
      description: '',
      button_text: '',
      button_link: '',
      is_active: true,
      start_date: '',
      end_date: '',
      start_datetime: '',
      end_datetime: '',
      order_number: '0',
      text_color: '',
      background_color: '',
      device_type: 'web',
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
    if (form.name) fd.append('name', form.name)
    fd.append('is_active', form.is_active ? '1' : '0')
    if (form.title) fd.append('title', form.title)
    if (form.subtitle) fd.append('subtitle', form.subtitle)
    if (form.description) fd.append('description', form.description)
    if (form.button_text) fd.append('button_text', form.button_text)
    if (form.button_link) fd.append('button_link', form.button_link)
    if (form.start_date) fd.append('start_date', form.start_date)
    if (form.end_date) fd.append('end_date', form.end_date)
    if (form.start_datetime) fd.append('start_datetime', form.start_datetime)
    if (form.end_datetime) fd.append('end_datetime', form.end_datetime)
    fd.append('order_number', form.order_number)
    if (form.text_color) fd.append('text_color', form.text_color)
    if (form.background_color) fd.append('background_color', form.background_color)
    fd.append('device_type', form.device_type)
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
    setForm({
      product_id: String(p.product_id),
      name: p.name || '',
      title: p.title || '',
      subtitle: p.subtitle || '',
      description: p.description || '',
      button_text: p.button_text || '',
      button_link: p.button_link || '',
      is_active: p.is_active,
      start_date: p.start_date || '',
      end_date: p.end_date || '',
      start_datetime: p.start_datetime || '',
      end_datetime: p.end_datetime || '',
      order_number: String(p.order_number || 0),
      text_color: p.text_color || '',
      background_color: p.background_color || '',
      device_type: p.device_type || 'web',
      imageFile: null,
    })
    setEditOpen(true)
  }

  const saveEdit = async () => {
    if (!editing) return
    const fd = new FormData()
    fd.append('product_id', form.product_id)
    if (form.name) fd.append('name', form.name)
    fd.append('is_active', form.is_active ? '1' : '0')
    if (form.title) fd.append('title', form.title)
    if (form.subtitle) fd.append('subtitle', form.subtitle)
    if (form.description) fd.append('description', form.description)
    if (form.button_text) fd.append('button_text', form.button_text)
    if (form.button_link) fd.append('button_link', form.button_link)
    if (form.start_date) fd.append('start_date', form.start_date)
    if (form.end_date) fd.append('end_date', form.end_date)
    if (form.start_datetime) fd.append('start_datetime', form.start_datetime)
    if (form.end_datetime) fd.append('end_datetime', form.end_datetime)
    fd.append('order_number', form.order_number)
    if (form.text_color) fd.append('text_color', form.text_color)
    if (form.background_color) fd.append('background_color', form.background_color)
    fd.append('device_type', form.device_type)
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by product name..."
              className="flex-1 md:max-w-sm"
            />
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
              <Button size="lg" onClick={() => setAddOpen(true)}>
                <Plus className="mr-2 size-4" /> Add Promotion
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Promotion</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Product</label>
                    <select
                      className="w-full rounded-md border px-3 py-2"
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
                  <div>
                    <label className="mb-1 block text-sm font-medium">Name (Internal)</label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Internal promotion name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Title</label>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. 40-50% OFF"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Subtitle</label>
                    <Input
                      value={form.subtitle}
                      onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                      placeholder="e.g. Mobile Accessories"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Description</label>
                  <textarea
                    className="w-full rounded-md border px-3 py-2 min-h-[80px]"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="e.g. All Brands Available"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Button Text</label>
                    <Input
                      value={form.button_text}
                      onChange={(e) => setForm({ ...form, button_text: e.target.value })}
                      placeholder="e.g. Shop Now"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Button Link</label>
                    <Input
                      value={form.button_link}
                      onChange={(e) => setForm({ ...form, button_link: e.target.value })}
                      placeholder="URL for redirection"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Start Date</label>
                    <Input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">End Date</label>
                    <Input
                      type="date"
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Start DateTime</label>
                    <Input
                      type="datetime-local"
                      value={form.start_datetime}
                      onChange={(e) => setForm({ ...form, start_datetime: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">End DateTime</label>
                    <Input
                      type="datetime-local"
                      value={form.end_datetime}
                      onChange={(e) => setForm({ ...form, end_datetime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Order Number</label>
                    <Input
                      type="number"
                      value={form.order_number}
                      onChange={(e) => setForm({ ...form, order_number: e.target.value })}
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Text Color</label>
                    <Input
                      value={form.text_color}
                      onChange={(e) => setForm({ ...form, text_color: e.target.value })}
                      placeholder="#000000"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Background Color</label>
                    <Input
                      value={form.background_color}
                      onChange={(e) => setForm({ ...form, background_color: e.target.value })}
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Device Type</label>
                    <select
                      className="w-full rounded-md border px-3 py-2"
                      value={form.device_type}
                      onChange={(e) => setForm({ ...form, device_type: e.target.value as 'web' | 'mobile' })}
                    >
                      <option value="web">Web</option>
                      <option value="mobile">Mobile</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Image</label>
                    <Input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,.svg"
                      onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] ?? null })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={form.is_active}
                    onCheckedChange={(v) => setForm({ ...form, is_active: !!v })}
                  />
                  <span className="text-sm font-medium">Active</span>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={addPromotion}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-xl border bg-card shadow-md">
          <div className="hidden md:block w-full overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-16 text-xs uppercase tracking-wide">ID</TableHead>
                <TableHead className="text-xs uppercase tracking-wide">Name</TableHead>
                <TableHead className="text-xs uppercase tracking-wide">Title</TableHead>
                <TableHead className="text-xs uppercase tracking-wide">Product</TableHead>
                <TableHead className="text-xs uppercase tracking-wide">Device</TableHead>
                <TableHead className="text-xs uppercase tracking-wide">Active</TableHead>
                <TableHead className="text-xs uppercase tracking-wide hidden md:table-cell">Image</TableHead>
                <TableHead className="w-28 text-right text-xs uppercase tracking-wide">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/20">
                  <TableCell>{p.id}</TableCell>
                  <TableCell className="whitespace-nowrap max-w-[150px] truncate" title={p.name || ''}>
                    {p.name || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap max-w-[150px] truncate" title={p.title || ''}>
                    {p.title || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{p.product?.name ?? `#${p.product_id}`}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      p.device_type === 'mobile' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {p.device_type || 'web'}
                    </span>
                  </TableCell>
                  <TableCell>{p.is_active ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="hidden md:table-cell">
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
          </div>
          <div className="md:hidden grid gap-2 p-3">
            {items.map((p) => (
              <div key={p.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{p.name || `Promotion #${p.id}`}</div>
                    {p.title && <div className="text-sm text-muted-foreground mt-1">{p.title}</div>}
                    <div className="text-xs text-muted-foreground mt-1">{p.product?.name ?? `#${p.product_id}`}</div>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    p.device_type === 'mobile' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {p.device_type || 'web'}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    p.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => startEdit(p)}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => startDelete(p)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
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
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Promotion</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Product</label>
                  <select
                    className="w-full rounded-md border px-3 py-2"
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
                <div>
                  <label className="mb-1 block text-sm font-medium">Name (Internal)</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Internal promotion name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Title</label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. 40-50% OFF"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Subtitle</label>
                  <Input
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    placeholder="e.g. Mobile Accessories"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <textarea
                  className="w-full rounded-md border px-3 py-2 min-h-[80px]"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. All Brands Available"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Button Text</label>
                  <Input
                    value={form.button_text}
                    onChange={(e) => setForm({ ...form, button_text: e.target.value })}
                    placeholder="e.g. Shop Now"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Button Link</label>
                  <Input
                    value={form.button_link}
                    onChange={(e) => setForm({ ...form, button_link: e.target.value })}
                    placeholder="URL for redirection"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Start DateTime</label>
                  <Input
                    type="datetime-local"
                    value={form.start_datetime}
                    onChange={(e) => setForm({ ...form, start_datetime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">End DateTime</label>
                  <Input
                    type="datetime-local"
                    value={form.end_datetime}
                    onChange={(e) => setForm({ ...form, end_datetime: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Order Number</label>
                  <Input
                    type="number"
                    value={form.order_number}
                    onChange={(e) => setForm({ ...form, order_number: e.target.value })}
                    min="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Text Color</label>
                  <Input
                    value={form.text_color}
                    onChange={(e) => setForm({ ...form, text_color: e.target.value })}
                    placeholder="#000000"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Background Color</label>
                  <Input
                    value={form.background_color}
                    onChange={(e) => setForm({ ...form, background_color: e.target.value })}
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Device Type</label>
                  <select
                    className="w-full rounded-md border px-3 py-2"
                    value={form.device_type}
                    onChange={(e) => setForm({ ...form, device_type: e.target.value as 'web' | 'mobile' })}
                  >
                    <option value="web">Web</option>
                    <option value="mobile">Mobile</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Image</label>
                  <Input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.svg"
                    onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] ?? null })}
                  />
                  {editing?.image && (
                    <div className="mt-2">
                      <img src={`/storage/${editing.image}`} alt="" className="size-12 rounded-md border object-cover" />
                      <p className="text-xs text-muted-foreground mt-1">Current image</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: !!v })}
                />
                <span className="text-sm font-medium">Active</span>
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
