import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ToastStack } from '@/components/ui/toast-stack';
import AppLayout from '@/layouts/app-layout';
import { delJson, patchJson, postJson } from '@/lib/http';
import { type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const slugify = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

type OwnerRef = {
    id: number;
    name: string;
    email: string;
};

type StoreItem = {
    id: number;
    owner_id: number;
    owner?: OwnerRef | null;
    name: string;
    slug: string;
    email?: string | null;
    phone?: string | null;
    business_whatsapp_url?: string | null;
    city?: string | null;
    address?: string | null;
    description?: string | null;
    status: 'pending' | 'active' | 'suspended';
    created_at?: string | null;
};

type Pagination = {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
};

type PageProps = {
    items: StoreItem[];
    users: OwnerRef[];
    pagination?: Pagination;
    filters?: {
        q?: string;
        status?: string;
    };
};

type StoreForm = {
    owner_id: string;
    name: string;
    slug: string;
    email: string;
    phone: string;
    business_whatsapp_url: string;
    city: string;
    address: string;
    description: string;
    status: 'pending' | 'active' | 'suspended';
};

const emptyForm: StoreForm = {
    owner_id: '',
    name: '',
    slug: '',
    email: '',
    phone: '',
    business_whatsapp_url: '',
    city: '',
    address: '',
    description: '',
    status: 'pending',
};

export default function StoresIndex() {
    const { props } = usePage<PageProps>();
    const authPage = usePage<SharedData>();
    const authExt = authPage.props.auth as unknown as {
        permissions?: string[];
    };
    const permissions = authExt.permissions ?? [];

    const items = props.items ?? [];
    const users = props.users ?? [];
    const pagination = props.pagination;
    const filters = props.filters ?? {};

    const canManage =
        permissions.includes('stores.manage_staff') ||
        permissions.includes('create stores') ||
        permissions.includes('edit stores') ||
        permissions.includes('delete stores');
    const canApprove =
        permissions.includes('stores.approve') ||
        permissions.includes('approve stores');
    const canSuspend =
        permissions.includes('stores.suspend') ||
        permissions.includes('suspend stores');

    const [query, setQuery] = useState(filters.q ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<StoreItem | null>(null);
    const [form, setForm] = useState<StoreForm>(emptyForm);
    const [toasts, setToasts] = useState<
        Array<{ id: number; title: string; variant: 'success' | 'error' }>
    >([]);

    useEffect(() => {
        setQuery(filters.q ?? '');
        setStatus(filters.status ?? '');
    }, [filters]);

    const dismissToast = (id: number) =>
        setToasts((current) => current.filter((toast) => toast.id !== id));

    const showToast = (
        title: string,
        variant: 'success' | 'error' = 'success',
    ) => {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        setToasts((current) => [...current, { id, title, variant }]);
        setTimeout(() => dismissToast(id), 2500);
    };

    const errorMessageFromResponse = async (res: Response): Promise<string> => {
        try {
            const data = (await res.json()) as any;
            if (data?.message && typeof data.message === 'string') {
                return data.message;
            }

            const firstError = data?.errors
                ? Object.values<any>(data.errors)?.flat()?.[0]
                : null;

            if (firstError && typeof firstError === 'string') {
                return firstError;
            }

            return `Request failed (${res.status}).`;
        } catch {
            return `Request failed (${res.status}).`;
        }
    };

    const resetForm = () => {
        setForm({
            ...emptyForm,
            owner_id: users[0]?.id ? String(users[0].id) : '',
        });
    };

    const applyFilters = (page = 1) => {
        router.get(
            '/admin/stores',
            {
                q: query || undefined,
                status: status || undefined,
                page,
            },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['items', 'users', 'pagination', 'filters'],
            },
        );
    };

    const openAddDialog = () => {
        resetForm();
        setAddOpen(true);
    };

    const openEditDialog = (store: StoreItem) => {
        setEditing(store);
        setForm({
            owner_id: String(store.owner_id),
            name: store.name,
            slug: store.slug,
            email: store.email ?? '',
            phone: store.phone ?? '',
            business_whatsapp_url: store.business_whatsapp_url ?? '',
            city: store.city ?? '',
            address: store.address ?? '',
            description: store.description ?? '',
            status: store.status,
        });
        setEditOpen(true);
    };

    const payloadFromForm = () => ({
        owner_id: Number(form.owner_id),
        name: form.name.trim(),
        slug: form.slug.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        business_whatsapp_url: form.business_whatsapp_url.trim() || null,
        city: form.city.trim() || null,
        address: form.address.trim() || null,
        description: form.description.trim() || null,
        status: form.status,
    });

    const createStore = async () => {
        const res = await postJson('/api/admin/stores', payloadFromForm());

        if (res.ok) {
            setAddOpen(false);
            resetForm();
            showToast('Store created.', 'success');
            applyFilters(pagination?.current_page ?? 1);
            return;
        }

        showToast(await errorMessageFromResponse(res), 'error');
    };

    const updateStore = async () => {
        if (!editing) {
            return;
        }

        const res = await patchJson(
            `/api/admin/stores/${editing.id}`,
            payloadFromForm(),
        );

        if (res.ok) {
            setEditOpen(false);
            setEditing(null);
            resetForm();
            showToast('Store updated.', 'success');
            applyFilters(pagination?.current_page ?? 1);
            return;
        }

        showToast(await errorMessageFromResponse(res), 'error');
    };

    const deleteStore = async (store: StoreItem) => {
        if (
            !window.confirm(
                `Delete "${store.name}"? This will also remove related store records.`,
            )
        ) {
            return;
        }

        const res = await delJson(`/api/admin/stores/${store.id}`);

        if (res.ok) {
            showToast('Store deleted.', 'success');
            applyFilters(pagination?.current_page ?? 1);
            return;
        }

        showToast(await errorMessageFromResponse(res), 'error');
    };

    const approveStore = async (storeId: number) => {
        const res = await postJson(`/api/admin/stores/${storeId}/approve`);
        if (res.ok) {
            showToast('Store approved.', 'success');
            applyFilters(pagination?.current_page ?? 1);
            return;
        }

        showToast(await errorMessageFromResponse(res), 'error');
    };

    const suspendStore = async (storeId: number) => {
        const res = await postJson(`/api/admin/stores/${storeId}/suspend`);
        if (res.ok) {
            showToast('Store suspended.', 'success');
            applyFilters(pagination?.current_page ?? 1);
            return;
        }

        showToast(await errorMessageFromResponse(res), 'error');
    };

    const canPrev = useMemo(
        () => (pagination ? pagination.current_page > 1 : false),
        [pagination],
    );
    const canNext = useMemo(
        () =>
            pagination ? pagination.current_page < pagination.last_page : false,
        [pagination],
    );

    const statusClassName = (value: StoreItem['status']) => {
        if (value === 'active') {
            return 'bg-emerald-100 text-emerald-700';
        }

        if (value === 'suspended') {
            return 'bg-red-100 text-red-700';
        }

        return 'bg-amber-100 text-amber-700';
    };

    const formBody = (
        <div className="grid gap-4">
            <div>
                <label className="mb-1.5 block text-sm font-medium">
                    Owner
                </label>
                <select
                    className="w-full rounded-md border px-3 py-2"
                    value={form.owner_id}
                    onChange={(e) =>
                        setForm((current) => ({
                            ...current,
                            owner_id: e.target.value,
                        }))
                    }
                >
                    <option value="">Select owner</option>
                    {users.map((user) => (
                        <option key={user.id} value={user.id}>
                            {user.name || `User #${user.id}`} ({user.email})
                        </option>
                    ))}
                </select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <label className="mb-1.5 block text-sm font-medium">
                        Store Name
                    </label>
                    <Input
                        value={form.name}
                        onChange={(e) =>
                            setForm((current) => {
                                const nextName = e.target.value;
                                const currentSlug = slugify(current.name);

                                return {
                                    ...current,
                                    name: nextName,
                                    slug:
                                        !current.slug || current.slug === currentSlug
                                            ? slugify(nextName)
                                            : current.slug,
                                };
                            })
                        }
                        placeholder="Managed Store"
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-medium">
                        Slug
                    </label>
                    <Input
                        value={form.slug}
                        onChange={(e) =>
                            setForm((current) => ({
                                ...current,
                                slug: e.target.value,
                            }))
                        }
                        placeholder="managed-store"
                    />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <label className="mb-1.5 block text-sm font-medium">
                        Email
                    </label>
                    <Input
                        value={form.email}
                        onChange={(e) =>
                            setForm((current) => ({
                                ...current,
                                email: e.target.value,
                            }))
                        }
                        placeholder="store@example.com"
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-medium">
                        Phone
                    </label>
                    <Input
                        value={form.phone}
                        onChange={(e) =>
                            setForm((current) => ({
                                ...current,
                                phone: e.target.value,
                            }))
                        }
                        placeholder="03001234567"
                    />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <label className="mb-1.5 block text-sm font-medium">
                        Business WhatsApp URL
                    </label>
                    <Input
                        value={form.business_whatsapp_url}
                        onChange={(e) =>
                            setForm((current) => ({
                                ...current,
                                business_whatsapp_url: e.target.value,
                            }))
                        }
                        placeholder="https://wa.me/923001234567"
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-medium">
                        Status
                    </label>
                    <select
                        className="w-full rounded-md border px-3 py-2"
                        value={form.status}
                        onChange={(e) =>
                            setForm((current) => ({
                                ...current,
                                status: e.target.value as StoreForm['status'],
                            }))
                        }
                    >
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                    </select>
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <label className="mb-1.5 block text-sm font-medium">
                        City
                    </label>
                    <Input
                        value={form.city}
                        onChange={(e) =>
                            setForm((current) => ({
                                ...current,
                                city: e.target.value,
                            }))
                        }
                        placeholder="Karachi"
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-medium">
                        Address
                    </label>
                    <Input
                        value={form.address}
                        onChange={(e) =>
                            setForm((current) => ({
                                ...current,
                                address: e.target.value,
                            }))
                        }
                        placeholder="Main Market"
                    />
                </div>
            </div>
            <div>
                <label className="mb-1.5 block text-sm font-medium">
                    Description
                </label>
                <textarea
                    className="min-h-[100px] w-full resize-y rounded-md border px-3 py-2 text-sm"
                    value={form.description}
                    onChange={(e) =>
                        setForm((current) => ({
                            ...current,
                            description: e.target.value,
                        }))
                    }
                    placeholder="Store notes or description"
                />
            </div>
        </div>
    );

    return (
        <AppLayout breadcrumbs={[{ title: 'Stores', href: '/admin/stores' }]}>
            <Head title="Stores" />
            <div className="grid gap-6 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by store, slug, email, or phone"
                            className="md:max-w-sm"
                        />
                        <select
                            className="rounded-md border px-3 py-2 md:w-44"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="">All statuses</option>
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                        </select>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => applyFilters(1)}
                            >
                                Search
                            </Button>
                            {(query || status) && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        setQuery('');
                                        setStatus('');
                                        router.get(
                                            '/admin/stores',
                                            {},
                                            {
                                                preserveScroll: true,
                                                preserveState: true,
                                                only: [
                                                    'items',
                                                    'users',
                                                    'pagination',
                                                    'filters',
                                                ],
                                            },
                                        );
                                    }}
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>
                    {canManage && (
                        <Button type="button" onClick={openAddDialog}>
                            Add Store
                        </Button>
                    )}
                </div>

                <div className="rounded-xl border bg-card shadow-sm">
                    <div className="hidden w-full overflow-x-auto md:block">
                        <Table className="min-w-[1100px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Store</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>City</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length ? (
                                    items.map((store) => (
                                        <TableRow key={store.id}>
                                            <TableCell>{store.id}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {store.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {store.slug}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {store.owner?.name ||
                                                        `User #${store.owner_id}`}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {store.owner?.email || '—'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>{store.email || '—'}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {store.phone || '—'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {store.city || '—'}
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClassName(store.status)}`}
                                                >
                                                    {store.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {canApprove &&
                                                        store.status !==
                                                            'active' && (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    approveStore(
                                                                        store.id,
                                                                    )
                                                                }
                                                            >
                                                                Approve
                                                            </Button>
                                                        )}
                                                    {canSuspend &&
                                                        store.status !==
                                                            'suspended' && (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() =>
                                                                    suspendStore(
                                                                        store.id,
                                                                    )
                                                                }
                                                            >
                                                                Suspend
                                                            </Button>
                                                        )}
                                                    {canManage && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                openEditDialog(
                                                                    store,
                                                                )
                                                            }
                                                        >
                                                            Edit
                                                        </Button>
                                                    )}
                                                    {canManage && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() =>
                                                                deleteStore(
                                                                    store,
                                                                )
                                                            }
                                                        >
                                                            Delete
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="py-10 text-center text-muted-foreground"
                                        >
                                            No stores found for the current filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="grid gap-3 p-3 md:hidden">
                        {items.length ? (
                            items.map((store) => (
                                <div
                                    key={store.id}
                                    className="rounded-lg border p-3"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="font-medium">
                                                {store.name}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {store.slug}
                                            </div>
                                        </div>
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClassName(store.status)}`}
                                        >
                                            {store.status}
                                        </span>
                                    </div>
                                    <div className="mt-3 space-y-1 text-sm">
                                        <div>
                                            Owner:{' '}
                                            {store.owner?.name ||
                                                `User #${store.owner_id}`}
                                        </div>
                                        <div className="text-muted-foreground">
                                            {store.email || '—'} •{' '}
                                            {store.phone || '—'}
                                        </div>
                                        <div className="text-muted-foreground">
                                            {store.city || 'No city'}
                                        </div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                                        {canApprove &&
                                            store.status !== 'active' && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        approveStore(store.id)
                                                    }
                                                >
                                                    Approve
                                                </Button>
                                            )}
                                        {canSuspend &&
                                            store.status !== 'suspended' && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        suspendStore(store.id)
                                                    }
                                                >
                                                    Suspend
                                                </Button>
                                            )}
                                        {canManage && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    openEditDialog(store)
                                                }
                                            >
                                                Edit
                                            </Button>
                                        )}
                                        {canManage && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="destructive"
                                                onClick={() =>
                                                    deleteStore(store)
                                                }
                                            >
                                                Delete
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
                                No stores found for the current filters.
                            </div>
                        )}
                    </div>
                </div>

                {pagination && pagination.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Page {pagination.current_page} of{' '}
                            {pagination.last_page}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={!canPrev}
                                onClick={() =>
                                    applyFilters(pagination.current_page - 1)
                                }
                            >
                                Previous
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={!canNext}
                                onClick={() =>
                                    applyFilters(pagination.current_page + 1)
                                }
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Store</DialogTitle>
                    </DialogHeader>
                    {formBody}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setAddOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="button" onClick={createStore}>
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Store</DialogTitle>
                    </DialogHeader>
                    {formBody}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setEditOpen(false);
                                setEditing(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="button" onClick={updateStore}>
                            Update
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ToastStack toasts={toasts} onDismiss={dismissToast} />
        </AppLayout>
    );
}
