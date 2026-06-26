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
import { Pencil, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

type SliderItem = {
    id: number
    image?: string | null
    title?: string | null
    subtitle?: string | null
    button_text?: string | null
    button_url?: string | null
    display_order: number
    is_active: boolean
    created_at?: string | null
}

type Pagination = { total: number; per_page: number; current_page: number; last_page: number }
type PageProps = {
    items: SliderItem[]
    pagination?: Pagination
    filters?: { q?: string; status?: string }
}

type SliderForm = {
    title: string
    subtitle: string
    button_text: string
    button_url: string
    display_order: string
    is_active: boolean
    imageFile?: File | null
}

const emptyForm = (): SliderForm => ({
    title: '',
    subtitle: '',
    button_text: '',
    button_url: '',
    display_order: '0',
    is_active: true,
    imageFile: null,
})

export default function SlidersIndex() {
    const { props } = usePage<PageProps>()
    const items = props.items ?? []
    const pagination = props.pagination
    const [query, setQuery] = useState(props.filters?.q ?? '')
    const [statusFilter, setStatusFilter] = useState(props.filters?.status ?? '')

    const [addOpen, setAddOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)

    const [editing, setEditing] = useState<SliderItem | null>(null)
    const [deleting, setDeleting] = useState<SliderItem | null>(null)

    const [form, setForm] = useState<SliderForm>(emptyForm())

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

    const applyFilters = (extra?: Record<string, unknown>) => {
        router.get(
            '/admin/sliders',
            { q: query || undefined, status: statusFilter || undefined, ...(extra ?? {}) },
            { preserveScroll: true, preserveState: true },
        )
    }

    useEffect(() => {
        setQuery(props.filters?.q ?? '')
        setStatusFilter(props.filters?.status ?? '')
    }, [props.filters])

    const canPrev = useMemo(() => (pagination ? pagination.current_page > 1 : false), [pagination])
    const canNext = useMemo(() => (pagination ? pagination.current_page < pagination.last_page : false), [pagination])

    const buildFormData = (f: SliderForm) => {
        const fd = new FormData()
        if (f.title) fd.append('title', f.title)
        if (f.subtitle) fd.append('subtitle', f.subtitle)
        if (f.button_text) fd.append('button_text', f.button_text)
        if (f.button_url) fd.append('button_url', f.button_url)
        fd.append('display_order', f.display_order)
        fd.append('is_active', f.is_active ? '1' : '0')
        if (f.imageFile) fd.append('image', f.imageFile)
        return fd
    }

    const addSlider = async () => {
        const res = await postForm('/api/admin/sliders', buildFormData(form))
        if (res.ok) {
            showToast('Slider created.', 'success')
            setForm(emptyForm())
            setAddOpen(false)
            applyFilters({ page: pagination?.current_page ?? 1 })
            return
        }
        showToast(await errorMessageFromResponse(res), 'error')
    }

    const startEdit = (s: SliderItem) => {
        setEditing(s)
        setForm({
            title: s.title ?? '',
            subtitle: s.subtitle ?? '',
            button_text: s.button_text ?? '',
            button_url: s.button_url ?? '',
            display_order: String(s.display_order ?? 0),
            is_active: s.is_active,
            imageFile: null,
        })
        setEditOpen(true)
    }

    const saveEdit = async () => {
        if (!editing) return
        const res = await patchForm(`/api/admin/sliders/${editing.id}`, buildFormData(form))
        if (res.ok) {
            showToast('Slider updated.', 'success')
            setEditOpen(false)
            setEditing(null)
            setForm(emptyForm())
            applyFilters({ page: pagination?.current_page ?? 1 })
            return
        }
        showToast(await errorMessageFromResponse(res), 'error')
    }

    const startDelete = (s: SliderItem) => {
        setDeleting(s)
        setDeleteOpen(true)
    }

    const confirmDelete = async () => {
        if (!deleting) return
        const res = await delJson(`/api/admin/sliders/${deleting.id}`)
        if (res.ok) {
            showToast('Slider deleted.', 'success')
            setDeleteOpen(false)
            setDeleting(null)
            applyFilters({ page: pagination?.current_page ?? 1 })
            return
        }
        showToast(await errorMessageFromResponse(res), 'error')
    }

    const toggleStatus = async (s: SliderItem) => {
        const res = await patchForm(`/api/admin/sliders/${s.id}/status`, new FormData())
        if (res.ok) {
            showToast(`Slider ${s.is_active ? 'deactivated' : 'activated'}.`, 'success')
            applyFilters({ page: pagination?.current_page ?? 1 })
            return
        }
        showToast(await errorMessageFromResponse(res), 'error')
    }

    const SliderFormFields = ({ f, onChange }: { f: SliderForm; onChange: (patch: Partial<SliderForm>) => void }) => (
        <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="mb-1 block text-sm font-medium">Title</label>
                    <Input
                        value={f.title}
                        onChange={(e) => onChange({ title: e.target.value })}
                        placeholder="e.g. Premium Electrical Components"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium">Subtitle</label>
                    <Input
                        value={f.subtitle}
                        onChange={(e) => onChange({ subtitle: e.target.value })}
                        placeholder="e.g. Quality guaranteed"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="mb-1 block text-sm font-medium">Button Text</label>
                    <Input
                        value={f.button_text}
                        onChange={(e) => onChange({ button_text: e.target.value })}
                        placeholder="e.g. Shop Now"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium">Button URL</label>
                    <Input
                        value={f.button_url}
                        onChange={(e) => onChange({ button_url: e.target.value })}
                        placeholder="e.g. /products or https://..."
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="mb-1 block text-sm font-medium">Display Order</label>
                    <Input
                        type="number"
                        min="0"
                        max="9999"
                        value={f.display_order}
                        onChange={(e) => onChange({ display_order: e.target.value })}
                        placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Lower number = shown first</p>
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium">Slider Image</label>
                    <Input
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp,.svg"
                        onChange={(e) => onChange({ imageFile: e.target.files?.[0] ?? null })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP, SVG · max 5 MB</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Checkbox
                    id="is_active"
                    checked={f.is_active}
                    onCheckedChange={(v) => onChange({ is_active: !!v })}
                />
                <label htmlFor="is_active" className="text-sm font-medium cursor-pointer">Active (visible on website)</label>
            </div>
        </div>
    )

    return (
        <AppLayout breadcrumbs={[{ title: 'Slider Management', href: '/admin/sliders' }]}>
            <Head title="Slider Management" />

            <div className="grid gap-6 p-4">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex flex-1 items-center gap-2 flex-wrap">
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters({ page: 1 })}
                            placeholder="Search by title or subtitle..."
                            className="flex-1 md:max-w-xs"
                        />
                        <select
                            className="rounded-md border px-3 py-2 text-sm"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value)
                                applyFilters({ status: e.target.value || undefined, page: 1 })
                            }}
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <Button variant="outline" size="sm" onClick={() => applyFilters({ page: 1 })}>
                            Search
                        </Button>
                        {(query || statusFilter) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setQuery('')
                                    setStatusFilter('')
                                    applyFilters({ q: undefined, status: undefined, page: 1 })
                                }}
                            >
                                Clear
                            </Button>
                        )}
                    </div>

                    <Dialog open={addOpen} onOpenChange={setAddOpen}>
                        <DialogTrigger asChild>
                            <Button size="lg">
                                <Plus className="mr-2 size-4" /> Add Slider
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="!max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add New Slider</DialogTitle>
                            </DialogHeader>
                            <div className="py-2">
                                <SliderFormFields f={form} onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))} />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                                <Button onClick={addSlider}>Create Slider</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Table */}
                <div className="rounded-xl border bg-card shadow-md">
                    {/* Desktop table */}
                    <div className="hidden md:block w-full overflow-x-auto">
                        <Table className="min-w-[750px]">
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead className="w-14 text-xs uppercase tracking-wide">#</TableHead>
                                    <TableHead className="w-20 text-xs uppercase tracking-wide">Image</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wide">Title</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wide">Subtitle</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wide">Button</TableHead>
                                    <TableHead className="w-20 text-xs uppercase tracking-wide">Order</TableHead>
                                    <TableHead className="w-24 text-xs uppercase tracking-wide">Status</TableHead>
                                    <TableHead className="w-32 text-right text-xs uppercase tracking-wide">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((s) => (
                                    <TableRow key={s.id} className="hover:bg-muted/20">
                                        <TableCell className="text-muted-foreground">{s.id}</TableCell>
                                        <TableCell>
                                            {s.image ? (
                                                <img
                                                    src={`/storage/${s.image}`}
                                                    alt={s.title ?? ''}
                                                    className="h-10 w-16 rounded-md border object-cover"
                                                />
                                            ) : (
                                                <div className="h-10 w-16 rounded-md border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                                    No img
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="max-w-[180px] truncate font-medium" title={s.title ?? ''}>
                                            {s.title || <span className="text-muted-foreground italic">Untitled</span>}
                                        </TableCell>
                                        <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground" title={s.subtitle ?? ''}>
                                            {s.subtitle || '—'}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {s.button_text ? (
                                                <span title={s.button_url ?? ''}>
                                                    {s.button_text}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">{s.display_order}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                                s.is_active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {s.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title={s.is_active ? 'Deactivate' : 'Activate'}
                                                    className={`rounded-full border ${s.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                                    onClick={() => toggleStatus(s)}
                                                >
                                                    {s.is_active ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Edit"
                                                    className="rounded-full border bg-blue-50 text-blue-600 hover:bg-blue-100"
                                                    onClick={() => startEdit(s)}
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Delete"
                                                    className="rounded-full border bg-rose-50 text-rose-600 hover:bg-rose-100"
                                                    onClick={() => startDelete(s)}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden grid gap-3 p-3">
                        {items.map((s) => (
                            <div key={s.id} className="rounded-lg border p-3 bg-card">
                                <div className="flex gap-3">
                                    {s.image ? (
                                        <img
                                            src={`/storage/${s.image}`}
                                            alt={s.title ?? ''}
                                            className="h-16 w-24 rounded-md border object-cover shrink-0"
                                        />
                                    ) : (
                                        <div className="h-16 w-24 rounded-md border bg-muted flex items-center justify-center text-xs text-muted-foreground shrink-0">
                                            No image
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{s.title || <span className="italic text-muted-foreground">Untitled</span>}</p>
                                        {s.subtitle && <p className="text-sm text-muted-foreground truncate">{s.subtitle}</p>}
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                s.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {s.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">Order: {s.display_order}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => toggleStatus(s)}>
                                        {s.is_active ? 'Deactivate' : 'Activate'}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => startEdit(s)}>Edit</Button>
                                    <Button variant="destructive" size="sm" onClick={() => startDelete(s)}>Delete</Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {(!items || items.length === 0) && (
                        <div className="p-12 text-center text-sm text-muted-foreground">
                            No sliders found. Click "Add Slider" to create your first one.
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && (
                        <div className="flex items-center justify-between border-t p-3">
                            <div className="text-sm text-muted-foreground">
                                Page {pagination.current_page} of {pagination.last_page} · {pagination.total} total
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!canPrev}
                                    onClick={() => applyFilters({ page: (pagination?.current_page ?? 1) - 1 })}
                                >
                                    Prev
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!canNext}
                                    onClick={() => applyFilters({ page: (pagination?.current_page ?? 1) + 1 })}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Edit Dialog */}
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent className="!max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Slider</DialogTitle>
                        </DialogHeader>
                        <div className="py-2">
                            {editing?.image && (
                                <div className="mb-4 p-3 rounded-lg border bg-muted/30">
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Current Image</p>
                                    <img src={`/storage/${editing.image}`} alt="" className="h-20 rounded-md border object-cover" />
                                    <p className="text-xs text-muted-foreground mt-1">Upload a new file below to replace it</p>
                                </div>
                            )}
                            <SliderFormFields f={form} onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))} />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setEditOpen(false); setEditing(null) }}>Cancel</Button>
                            <Button onClick={saveEdit}>Save Changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirm Dialog */}
                <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Slider</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-muted-foreground">
                            Are you sure you want to delete the slider{deleting?.title ? ` "${deleting.title}"` : ` #${deleting?.id}`}?
                            This will also remove the uploaded image. This action cannot be undone.
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
    )
}
