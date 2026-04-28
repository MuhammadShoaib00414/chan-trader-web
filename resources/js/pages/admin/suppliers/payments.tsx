import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { requestJson } from '@/lib/http';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { CalendarClock, Plus } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';

type StoreOption = {
    id: number;
    name: string;
};

type Supplier = {
    id: number;
    name: string;
    category?: string;
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
    remaining_balance: number;
    next_installment_amount: number;
    next_installment_due?: string | null;
    status: 'active' | 'completed';
    supplier: Supplier;
    store?: StoreOption | null;
};

type Payment = {
    id: number;
    supplier_transaction_id: number;
    amount: number;
    paid_at: string;
    installment_number: number;
    transaction: {
        id: number;
        paid_installments: number;
        total_installments: number;
        remaining_balance: number;
        store?: StoreOption | null;
        supplier: Supplier;
    };
};

interface PaymentsIndexProps {
    payments: Payment[];
    transactions: Transaction[];
    suppliers: Supplier[];
    stores: StoreOption[];
    filters: {
        q?: string;
        supplier_id?: string | number;
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

async function extractErrorMessage(response: Response): Promise<string> {
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (payload?.errors) {
        const firstError = Object.values(payload.errors).flat()[0];
        if (firstError) {
            return firstError;
        }
    }

    return payload?.message ?? 'Unable to record the payment right now.';
}

export default function PaymentsIndex({ payments, transactions, suppliers, stores, filters }: PaymentsIndexProps) {
    const [open, setOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [transactionId, setTransactionId] = useState('');
    const [amount, setAmount] = useState('');
    const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0] ?? '');
    const [query, setQuery] = useState(filters.q ?? '');
    const [filterSupplierId, setFilterSupplierId] = useState(filters.supplier_id ? String(filters.supplier_id) : 'all');
    const [filterStoreId, setFilterStoreId] = useState(filters.store_id ? String(filters.store_id) : 'all');

    useEffect(() => {
        setQuery(filters.q ?? '');
        setFilterSupplierId(filters.supplier_id ? String(filters.supplier_id) : 'all');
        setFilterStoreId(filters.store_id ? String(filters.store_id) : 'all');
    }, [filters]);

    const activeTransactions = useMemo(
        () => transactions.filter((transaction) => transaction.status === 'active'),
        [transactions],
    );

    const selectedTransaction = useMemo(
        () => activeTransactions.find((transaction) => String(transaction.id) === transactionId) ?? null,
        [activeTransactions, transactionId],
    );

    const totalPaidThisModule = useMemo(
        () => payments.reduce((sum, payment) => sum + payment.amount, 0),
        [payments],
    );

    const resetForm = () => {
        setTransactionId('');
        setAmount('');
        setPaidAt(new Date().toISOString().split('T')[0] ?? '');
        setFormError(null);
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

    useEffect(() => {
        if (selectedTransaction) {
            setAmount(String(selectedTransaction.next_installment_amount));
        }
    }, [selectedTransaction]);

    const applyFilters = () => {
        router.get(
            '/admin/supplier-payments',
            {
                q: query || undefined,
                supplier_id: filterSupplierId !== 'all' ? filterSupplierId : undefined,
                store_id: filterStoreId !== 'all' ? filterStoreId : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['payments', 'filters'],
            },
        );
    };

    const clearFilters = () => {
        setQuery('');
        setFilterSupplierId('all');
        setFilterStoreId('all');
        router.get(
            '/admin/supplier-payments',
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['payments', 'filters'],
            },
        );
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setProcessing(true);
        setFormError(null);

        const response = await requestJson('POST', '/admin/supplier-payments', {
            supplier_transaction_id: Number(transactionId),
            amount: Number(amount),
            paid_at: paidAt,
        });

        if (!response.ok) {
            setFormError(await extractErrorMessage(response));
            setProcessing(false);
            return;
        }

        closeDialog(false);
        router.reload({ only: ['payments', 'transactions', 'filters'] });
        setProcessing(false);
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Supplier Payments', href: '/admin/supplier-payments' }]}>
            <Head title="Supplier Payments" />
            <div className="space-y-6 p-4 md:p-6">
                <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                    <Card className="overflow-hidden border-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_38%),linear-gradient(135deg,_#082f49,_#0f172a_58%,_#1d4ed8)] text-white shadow-2xl">
                        <CardContent className="space-y-4 p-6">
                            <div className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/80">
                                Supplier Payments
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-black tracking-tight">Post weekly installments and follow payments by supplier or store.</h1>
                                <p className="max-w-2xl text-sm text-white/80">
                                    Payment entries reduce the real balance automatically and stay linked to the supplier transaction ledger.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Link href="/admin/suppliers" className="inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
                                    Suppliers
                                </Link>
                                <Link href="/admin/supplier-transactions" className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white/90">
                                    Transactions
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
                                <CardDescription>Open Weekly Dues</CardDescription>
                                <CardTitle className="text-3xl font-black">{activeTransactions.length}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">Schedules that still need payment entries.</CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardHeader className="pb-2">
                                <CardDescription>Total Recorded Payments</CardDescription>
                                <CardTitle className="text-3xl font-black">{formatCurrency(totalPaidThisModule)}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">All supplier installments recorded so far.</CardContent>
                        </Card>
                    </div>
                </section>

                <Card className="shadow-sm">
                    <CardHeader>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <CardTitle>Payment Filters</CardTitle>
                                <CardDescription>Search payment history by supplier and store.</CardDescription>
                            </div>
                            <Button onClick={openCreateDialog} disabled={activeTransactions.length === 0}>
                                <Plus className="mr-2 h-4 w-4" />
                                Record Payment
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto_auto]">
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
                        <Button onClick={applyFilters}>Apply</Button>
                        <Button variant="outline" onClick={clearFilters}>
                            Clear
                        </Button>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Payment History</CardTitle>
                        <CardDescription>Weekly installments already paid to suppliers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {payments.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-muted-foreground">
                                No supplier payments matched these filters.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead>Store</TableHead>
                                        <TableHead>Installment</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Paid On</TableHead>
                                        <TableHead>Remaining After Payment</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell className="font-medium">{payment.transaction.supplier.name}</TableCell>
                                            <TableCell>{payment.transaction.store?.name ?? 'Unassigned'}</TableCell>
                                            <TableCell>
                                                {payment.installment_number}/{payment.transaction.total_installments}
                                            </TableCell>
                                            <TableCell>{formatCurrency(payment.amount)}</TableCell>
                                            <TableCell>{new Date(payment.paid_at).toLocaleDateString()}</TableCell>
                                            <TableCell>{formatCurrency(payment.transaction.remaining_balance)}</TableCell>
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
                            <DialogTitle>Record Supplier Payment</DialogTitle>
                            <DialogDescription>Select a payable schedule and post the next weekly installment.</DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Transaction</label>
                                <Select value={transactionId} onValueChange={setTransactionId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select active transaction" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {activeTransactions.map((transaction) => (
                                            <SelectItem key={transaction.id} value={String(transaction.id)}>
                                                {transaction.supplier.name} - {transaction.store?.name ?? 'No store'} - installment {transaction.paid_installments + 1}/{transaction.total_installments}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedTransaction ? (
                                <div className="rounded-3xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
                                    <div className="flex items-center gap-2 font-semibold">
                                        <CalendarClock className="h-4 w-4" />
                                        Next Weekly Payment
                                    </div>
                                    <div className="mt-2">Supplier: {selectedTransaction.supplier.name}</div>
                                    <div>Store: {selectedTransaction.store?.name ?? 'No store'}</div>
                                    <div>Remaining balance: {formatCurrency(selectedTransaction.remaining_balance)}</div>
                                    <div>Next installment amount: {formatCurrency(selectedTransaction.next_installment_amount)}</div>
                                    <div>
                                        Due date:{' '}
                                        {selectedTransaction.next_installment_due
                                            ? new Date(selectedTransaction.next_installment_due).toLocaleDateString()
                                            : 'Not available'}
                                    </div>
                                </div>
                            ) : null}

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Amount</label>
                                    <Input type="number" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Payment Date</label>
                                    <Input type="date" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} required />
                                </div>
                            </div>

                            {formError ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div> : null}

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => closeDialog(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing || !selectedTransaction}>
                                    {processing ? 'Recording...' : 'Record Payment'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
