import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { requestJson } from '@/lib/http';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Building2, Edit2, MoreHorizontal, Plus, ScrollText, Trash2 } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';

type StoreOption = {
    id: number;
    name: string;
};

type Supplier = {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    category: string;
    created_at: string;
    stores: StoreOption[];
    transactions_count: number;
    outstanding_balance: number;
};

interface SuppliersIndexProps {
    suppliers: Supplier[];
    stores: StoreOption[];
    categories: string[];
    filters: {
        q?: string;
        category?: string;
        store_id?: string | number;
    };
}

type ApiErrorPayload = {
    message?: string;
    errors?: Record<string, string[]>;
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        maximumFractionDigits: 2,
    }).format(amount ?? 0);

const formatCategory = (category: string) => category.charAt(0).toUpperCase() + category.slice(1);

async function extractErrorMessage(response: Response): Promise<string> {
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (payload?.errors) {
        const firstError = Object.values(payload.errors).flat()[0];
        if (firstError) {
            return firstError;
        }
    }

    return payload?.message ?? 'Unable to save supplier right now.';
}

export default function SuppliersIndex({ suppliers, stores, categories, filters }: SuppliersIndexProps) {
    const [open, setOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [processing, setProcessing] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [category, setCategory] = useState(categories[0] ?? 'local');
    const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([]);
    const [query, setQuery] = useState(filters.q ?? '');
    const [filterCategory, setFilterCategory] = useState(filters.category ?? 'all');
    const [filterStoreId, setFilterStoreId] = useState(filters.store_id ? String(filters.store_id) : 'all');

    useEffect(() => {
        setQuery(filters.q ?? '');
        setFilterCategory(filters.category ?? 'all');
        setFilterStoreId(filters.store_id ? String(filters.store_id) : 'all');
    }, [filters]);

    const totals = useMemo(() => {
        return suppliers.reduce(
            (carry, supplier) => ({
                count: carry.count + 1,
                outstanding: carry.outstanding + supplier.outstanding_balance,
            }),
            { count: 0, outstanding: 0 },
        );
    }, [suppliers]);

    const resetForm = () => {
        setName('');
        setEmail('');
        setPhone('');
        setAddress('');
        setCategory(categories[0] ?? 'local');
        setSelectedStoreIds([]);
        setFormError(null);
        setEditingSupplier(null);
    };

    const closeDialog = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) {
            resetForm();
        }
    };

    const openCreateDialog = () => {
        resetForm();
        setOpen(true);
    };

    const openEditDialog = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setName(supplier.name);
        setEmail(supplier.email);
        setPhone(supplier.phone ?? '');
        setAddress(supplier.address ?? '');
        setCategory(supplier.category);
        setSelectedStoreIds(supplier.stores.map((store) => store.id));
        setFormError(null);
        setOpen(true);
    };

    const toggleStore = (storeId: number) => {
        setSelectedStoreIds((current) =>
            current.includes(storeId) ? current.filter((id) => id !== storeId) : [...current, storeId],
        );
    };

    const applyFilters = () => {
        router.get(
            '/admin/suppliers',
            {
                q: query || undefined,
                category: filterCategory !== 'all' ? filterCategory : undefined,
                store_id: filterStoreId !== 'all' ? filterStoreId : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['suppliers', 'filters'],
            },
        );
    };

    const clearFilters = () => {
        setQuery('');
        setFilterCategory('all');
        setFilterStoreId('all');
        router.get(
            '/admin/suppliers',
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['suppliers', 'filters'],
            },
        );
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setProcessing(true);
        setFormError(null);

        const payload = {
            name,
            email,
            phone: phone || null,
            address: address || null,
            category,
            store_ids: selectedStoreIds,
        };

        const response = editingSupplier
            ? await requestJson('PUT', `/admin/suppliers/${editingSupplier.id}`, payload)
            : await requestJson('POST', '/admin/suppliers', payload);

        if (!response.ok) {
            setFormError(await extractErrorMessage(response));
            setProcessing(false);
            return;
        }

        closeDialog(false);
        router.reload({ only: ['suppliers', 'filters'] });
        setProcessing(false);
    };

    const handleDelete = async (supplier: Supplier) => {
        if (!confirm(`Delete supplier "${supplier.name}"?`)) {
            return;
        }

        const response = await requestJson('DELETE', `/admin/suppliers/${supplier.id}`);
        if (!response.ok) {
            alert(await extractErrorMessage(response));
            return;
        }

        router.reload({ only: ['suppliers', 'filters'] });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Suppliers', href: '/admin/suppliers' }]}>
            <Head title="Suppliers" />
            <div className="space-y-6 p-4 md:p-6">
                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_36%),linear-gradient(135deg,_#0f172a,_#1e293b_58%,_#14532d)] p-6 text-white shadow-2xl">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <div className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/80">
                                Supplier Management
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-black tracking-tight md:text-4xl">Search suppliers, assign stores, and keep each supplier ledger easy to reach.</h1>
                                <p className="max-w-2xl text-sm text-white/80 md:text-base">
                                    Suppliers can now be grouped by category, assigned to multiple stores, and opened into their own ledger/history page.
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:grid-cols-2">
                            <div>
                                <div className="text-xs uppercase tracking-[0.25em] text-white/60">Suppliers</div>
                                <div className="mt-2 text-3xl font-black">{totals.count}</div>
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-[0.25em] text-white/60">Outstanding</div>
                                <div className="mt-2 text-3xl font-black">{formatCurrency(totals.outstanding)}</div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="flex flex-wrap gap-2">
                    <Link href="/admin/supplier-transactions" className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
                        Transactions
                    </Link>
                    <Link href="/admin/supplier-payments" className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
                        Payments
                    </Link>
                    <Link href="/admin/supplier-dashboard" className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
                        Dashboard
                    </Link>
                </div>

                <Card className="shadow-sm">
                    <CardHeader>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <CardTitle>Supplier Directory</CardTitle>
                                <CardDescription>Filter by search, category, or assigned store.</CardDescription>
                            </div>
                            <Button onClick={openCreateDialog}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Supplier
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto_auto]">
                            <Input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search by supplier name, email, or phone"
                            />
                            <Select value={filterCategory} onValueChange={setFilterCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All categories</SelectItem>
                                    {categories.map((item) => (
                                        <SelectItem key={item} value={item}>
                                            {formatCategory(item)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filterStoreId} onValueChange={setFilterStoreId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Store" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All stores</SelectItem>
                                    {stores.map((store) => (
                                        <SelectItem key={store.id} value={String(store.id)}>
                                            {store.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button onClick={applyFilters}>Apply</Button>
                            <Button variant="outline" onClick={clearFilters}>
                                Clear
                            </Button>
                        </div>

                        {suppliers.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                                <Building2 className="mx-auto h-10 w-10 text-slate-400" />
                                <p className="mt-4 text-sm text-muted-foreground">No suppliers matched these filters.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Stores</TableHead>
                                        <TableHead>Transactions</TableHead>
                                        <TableHead>Outstanding</TableHead>
                                        <TableHead className="w-[80px] text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {suppliers.map((supplier) => (
                                        <TableRow key={supplier.id}>
                                            <TableCell>
                                                <div className="font-medium">{supplier.name}</div>
                                                <div className="text-xs text-muted-foreground">{supplier.email}</div>
                                                <div className="text-xs text-muted-foreground">{supplier.phone || 'No phone saved'}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{formatCategory(supplier.category)}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {supplier.stores.length ? (
                                                        supplier.stores.map((store) => (
                                                            <Badge key={store.id} variant="secondary">
                                                                {store.name}
                                                            </Badge>
                                                        ))
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">Unassigned</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{supplier.transactions_count}</TableCell>
                                            <TableCell>{formatCurrency(supplier.outstanding_balance)}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/admin/suppliers/${supplier.id}`}>
                                                                <ScrollText className="mr-2 h-4 w-4" />
                                                                View Ledger
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openEditDialog(supplier)}>
                                                            <Edit2 className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDelete(supplier)} className="text-destructive focus:text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={open} onOpenChange={closeDialog}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
                            <DialogDescription>
                                {editingSupplier ? 'Update category, contact details, and store assignments.' : 'Create a supplier profile and assign it to one or more stores.'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Supplier Name</label>
                                <Input value={name} onChange={(event) => setName(event.target.value)} required />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Phone</label>
                                    <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Address</label>
                                <Input value={address} onChange={(event) => setAddress(event.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category</label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((item) => (
                                            <SelectItem key={item} value={item}>
                                                {formatCategory(item)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-medium">Assign Stores</label>
                                <div className="grid gap-3 rounded-3xl border border-slate-200 p-4 sm:grid-cols-2">
                                    {stores.length ? (
                                        stores.map((store) => (
                                            <label key={store.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-2">
                                                <Checkbox checked={selectedStoreIds.includes(store.id)} onCheckedChange={() => toggleStore(store.id)} />
                                                <span className="text-sm">{store.name}</span>
                                            </label>
                                        ))
                                    ) : (
                                        <div className="text-sm text-muted-foreground">No stores available yet.</div>
                                    )}
                                </div>
                            </div>

                            {formError ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div> : null}

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => closeDialog(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving...' : editingSupplier ? 'Update Supplier' : 'Create Supplier'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
