import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { requestJson } from '@/lib/http';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Edit2, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';

type StoreOption = {
    id: number;
    name: string;
};

type Supplier = {
    id: number;
    name: string;
    category?: string;
    stores: StoreOption[];
};

type Transaction = {
    id: number;
    supplier_id: number;
    store_id?: number | null;
    goods_value: number;
    total_payable: number;
    payment_duration: number;
    installment_amount: number;
    total_installments: number;
    paid_installments: number;
    paid_amount: number;
    remaining_balance: number;
    next_installment_amount: number;
    next_installment_due?: string | null;
    status: 'active' | 'completed';
    created_at?: string;
    supplier: Supplier;
    store?: StoreOption | null;
};

interface TransactionsIndexProps {
    transactions: Transaction[];
    suppliers: Supplier[];
    stores: StoreOption[];
    filters: {
        q?: string;
        supplier_id?: string | number;
        store_id?: string | number;
        status?: string;
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

async function extractErrorMessage(response: Response): Promise<string> {
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (payload?.errors) {
        const firstError = Object.values(payload.errors).flat()[0];
        if (firstError) {
            return firstError;
        }
    }

    return payload?.message ?? 'Unable to save the transaction right now.';
}

export default function TransactionsIndex({ transactions, suppliers, stores, filters }: TransactionsIndexProps) {
    const [open, setOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [processing, setProcessing] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [supplierId, setSupplierId] = useState('');
    const [storeId, setStoreId] = useState('none');
    const [goodsValue, setGoodsValue] = useState('');
    const [totalPayable, setTotalPayable] = useState('');
    const [paymentDuration, setPaymentDuration] = useState('');
    const [query, setQuery] = useState(filters.q ?? '');
    const [filterSupplierId, setFilterSupplierId] = useState(filters.supplier_id ? String(filters.supplier_id) : 'all');
    const [filterStoreId, setFilterStoreId] = useState(filters.store_id ? String(filters.store_id) : 'all');
    const [filterStatus, setFilterStatus] = useState(filters.status ?? 'all');

    useEffect(() => {
        setQuery(filters.q ?? '');
        setFilterSupplierId(filters.supplier_id ? String(filters.supplier_id) : 'all');
        setFilterStoreId(filters.store_id ? String(filters.store_id) : 'all');
        setFilterStatus(filters.status ?? 'all');
    }, [filters]);

    const selectedSupplier = useMemo(
        () => suppliers.find((supplier) => String(supplier.id) === supplierId) ?? null,
        [supplierId, suppliers],
    );

    const availableStores = useMemo(() => selectedSupplier?.stores ?? stores, [selectedSupplier, stores]);

    useEffect(() => {
        if (storeId === 'none') {
            return;
        }

        const existsInAvailableStores = availableStores.some((store) => String(store.id) === storeId);
        if (!existsInAvailableStores) {
            setStoreId('none');
        }
    }, [availableStores, storeId]);

    const activeTransactions = useMemo(
        () => transactions.filter((transaction) => transaction.status === 'active'),
        [transactions],
    );

    const totalOutstanding = useMemo(
        () => activeTransactions.reduce((sum, transaction) => sum + transaction.remaining_balance, 0),
        [activeTransactions],
    );

    const schedulePreview = useMemo(() => {
        const parsedTotal = Number(totalPayable);
        const parsedDuration = Number(paymentDuration);

        if (!parsedTotal || !parsedDuration) {
            return null;
        }

        const installments = parsedDuration === 1 ? 4 : 8;
        return {
            installments,
            weeklyAmount: parsedTotal / installments,
        };
    }, [paymentDuration, totalPayable]);

    const resetForm = () => {
        setSupplierId('');
        setStoreId('none');
        setGoodsValue('');
        setTotalPayable('');
        setPaymentDuration('');
        setFormError(null);
        setEditingTransaction(null);
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

    const openEditDialog = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setSupplierId(String(transaction.supplier_id));
        setStoreId(transaction.store_id ? String(transaction.store_id) : 'none');
        setGoodsValue(String(transaction.goods_value));
        setTotalPayable(String(transaction.total_payable));
        setPaymentDuration(String(transaction.payment_duration));
        setFormError(null);
        setOpen(true);
    };

    const applyFilters = () => {
        router.get(
            '/admin/supplier-transactions',
            {
                q: query || undefined,
                supplier_id: filterSupplierId !== 'all' ? filterSupplierId : undefined,
                store_id: filterStoreId !== 'all' ? filterStoreId : undefined,
                status: filterStatus !== 'all' ? filterStatus : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['transactions', 'filters'],
            },
        );
    };

    const clearFilters = () => {
        setQuery('');
        setFilterSupplierId('all');
        setFilterStoreId('all');
        setFilterStatus('all');
        router.get(
            '/admin/supplier-transactions',
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['transactions', 'filters'],
            },
        );
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setProcessing(true);
        setFormError(null);

        const payload = {
            supplier_id: Number(supplierId),
            store_id: storeId !== 'none' ? Number(storeId) : null,
            goods_value: Number(goodsValue),
            total_payable: Number(totalPayable),
            payment_duration: Number(paymentDuration),
        };

        const response = editingTransaction
            ? await requestJson('PUT', `/admin/supplier-transactions/${editingTransaction.id}`, payload)
            : await requestJson('POST', '/admin/supplier-transactions', payload);

        if (!response.ok) {
            setFormError(await extractErrorMessage(response));
            setProcessing(false);
            return;
        }

        closeDialog(false);
        router.reload({ only: ['transactions', 'filters'] });
        setProcessing(false);
    };

    const handleDelete = async (transaction: Transaction) => {
        if (!confirm(`Delete the payable schedule for ${transaction.supplier.name}?`)) {
            return;
        }

        const response = await requestJson('DELETE', `/admin/supplier-transactions/${transaction.id}`);
        if (!response.ok) {
            alert(await extractErrorMessage(response));
            return;
        }

        router.reload({ only: ['transactions', 'filters'] });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Supplier Transactions', href: '/admin/supplier-transactions' }]}>
            <Head title="Supplier Transactions" />
            <div className="space-y-6 p-4 md:p-6">
                <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                    <Card className="overflow-hidden border-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.16),_transparent_38%),linear-gradient(135deg,_#111827,_#1f2937_58%,_#7c2d12)] text-white shadow-2xl">
                        <CardContent className="space-y-4 p-6">
                            <div className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/80">
                                Weekly Installments
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-black tracking-tight">Track supplier payables per supplier and per store.</h1>
                                <p className="max-w-2xl text-sm text-white/80">
                                    Assign each transaction to a supplier, optionally tie it to one of that supplier&apos;s stores, and split the payable amount into weekly installments.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Link href="/admin/suppliers" className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white/90">
                                    Suppliers
                                </Link>
                                <Link href="/admin/supplier-payments" className="inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
                                    Payments
                                </Link>
                                <Link href="/admin/supplier-dashboard" className="inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
                                    Dashboard
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <Card className="shadow-sm">
                            <CardHeader className="pb-2">
                                <CardDescription>Active Schedules</CardDescription>
                                <CardTitle className="text-3xl font-black">{activeTransactions.length}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">Transactions still waiting on installments.</CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardHeader className="pb-2">
                                <CardDescription>Outstanding Payables</CardDescription>
                                <CardTitle className="text-3xl font-black">{formatCurrency(totalOutstanding)}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">Remaining balance across all active supplier transactions.</CardContent>
                        </Card>
                    </div>
                </section>

                <Card className="shadow-sm">
                    <CardHeader>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <CardTitle>Transaction Filters</CardTitle>
                                <CardDescription>Search by supplier and narrow by supplier, store, or payment status.</CardDescription>
                            </div>
                            <Button onClick={openCreateDialog}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Transaction
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.7fr_auto_auto]">
                        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search supplier name or email" />
                        <Select value={filterSupplierId} onValueChange={setFilterSupplierId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Supplier" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All suppliers</SelectItem>
                                {suppliers.map((supplier) => (
                                    <SelectItem key={supplier.id} value={String(supplier.id)}>
                                        {supplier.name}
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
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={applyFilters}>Apply</Button>
                        <Button variant="outline" onClick={clearFilters}>
                            Clear
                        </Button>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Supplier Payable Schedules</CardTitle>
                        <CardDescription>Each record shows supplier, store assignment, installment progress, and remaining balance.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {transactions.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-muted-foreground">
                                No supplier transactions matched these filters.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead>Store</TableHead>
                                        <TableHead>Goods Value</TableHead>
                                        <TableHead>Total Payable</TableHead>
                                        <TableHead>Schedule</TableHead>
                                        <TableHead>Paid</TableHead>
                                        <TableHead>Remaining</TableHead>
                                        <TableHead>Next Due</TableHead>
                                        <TableHead className="w-[80px] text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((transaction) => (
                                        <TableRow key={transaction.id}>
                                            <TableCell>
                                                <div className="font-medium">{transaction.supplier.name}</div>
                                                {transaction.supplier.category ? (
                                                    <div className="text-xs text-muted-foreground capitalize">{transaction.supplier.category}</div>
                                                ) : null}
                                            </TableCell>
                                            <TableCell>{transaction.store?.name ?? 'Unassigned'}</TableCell>
                                            <TableCell>{formatCurrency(transaction.goods_value)}</TableCell>
                                            <TableCell>{formatCurrency(transaction.total_payable)}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {transaction.payment_duration} month{transaction.payment_duration > 1 ? 's' : ''}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {transaction.paid_installments}/{transaction.total_installments} installments
                                                </div>
                                            </TableCell>
                                            <TableCell>{formatCurrency(transaction.paid_amount)}</TableCell>
                                            <TableCell>{formatCurrency(transaction.remaining_balance)}</TableCell>
                                            <TableCell>
                                                {transaction.next_installment_due ? (
                                                    <div>
                                                        <div className="font-medium">{new Date(transaction.next_installment_due).toLocaleDateString()}</div>
                                                        <div className="text-xs text-muted-foreground">{formatCurrency(transaction.next_installment_amount)}</div>
                                                    </div>
                                                ) : (
                                                    <Badge>Completed</Badge>
                                                )}
                                            </TableCell>
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
                                                        <DropdownMenuItem onClick={() => openEditDialog(transaction)} disabled={transaction.paid_installments > 0}>
                                                            <Edit2 className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDelete(transaction)} className="text-destructive focus:text-destructive" disabled={transaction.paid_installments > 0}>
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
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
                            <DialogDescription>
                                {editingTransaction ? 'Adjust the supplier transaction before any payments are recorded.' : 'Create a supplier payable plan with automatic weekly installments.'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Supplier</label>
                                <Select value={supplierId} onValueChange={setSupplierId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map((supplier) => (
                                            <SelectItem key={supplier.id} value={String(supplier.id)}>
                                                {supplier.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Store</label>
                                <Select value={storeId} onValueChange={setStoreId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select store" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No store</SelectItem>
                                        {availableStores.map((store) => (
                                            <SelectItem key={store.id} value={String(store.id)}>
                                                {store.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">Only stores assigned to this supplier are available here.</p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Goods Value</label>
                                    <Input type="number" step="0.01" value={goodsValue} onChange={(event) => setGoodsValue(event.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Total Payable</label>
                                    <Input type="number" step="0.01" value={totalPayable} onChange={(event) => setTotalPayable(event.target.value)} required />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Payment Duration</label>
                                <Select value={paymentDuration} onValueChange={setPaymentDuration}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select duration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 month - 4 weekly installments</SelectItem>
                                        <SelectItem value="2">2 months - 8 weekly installments</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {schedulePreview ? (
                                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                                    <div className="font-semibold">Installment Preview</div>
                                    <div className="mt-2">Schedule: {schedulePreview.installments} weekly installments</div>
                                    <div>Approx weekly amount: {formatCurrency(schedulePreview.weeklyAmount)}</div>
                                </div>
                            ) : null}

                            {formError ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div> : null}

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => closeDialog(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving...' : editingTransaction ? 'Update Transaction' : 'Create Transaction'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
