import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';

type StoreRef = {
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
    stores: StoreRef[];
};

type TransactionPayment = {
    id: number;
    amount: number;
    paid_at: string;
    installment_number: number;
};

type Transaction = {
    id: number;
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
    progress_percentage: number;
    status: 'active' | 'completed';
    created_at?: string;
    store?: StoreRef | null;
    payments: TransactionPayment[];
};

type LedgerPayment = {
    id: number;
    amount: number;
    paid_at: string;
    installment_number: number;
    transaction: {
        id: number;
        store?: StoreRef | null;
        total_installments: number;
    };
};

interface SupplierLedgerProps {
    supplier: Supplier;
    summary: {
        transactions_count: number;
        total_payable: number;
        total_paid: number;
        outstanding_balance: number;
    };
    transactions: Transaction[];
    payments: LedgerPayment[];
}

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        maximumFractionDigits: 2,
    }).format(amount ?? 0);

const formatCategory = (category: string) => category.charAt(0).toUpperCase() + category.slice(1);

export default function SupplierLedger({ supplier, summary, transactions, payments }: SupplierLedgerProps) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Suppliers', href: '/admin/suppliers' },
                { title: supplier.name, href: `/admin/suppliers/${supplier.id}` },
            ]}
        >
            <Head title={`${supplier.name} Ledger`} />
            <div className="space-y-6 p-4 md:p-6">
                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_36%),linear-gradient(135deg,_#111827,_#1f2937_58%,_#166534)] p-6 text-white shadow-2xl">
                    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                        <div className="space-y-3">
                            <div className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/80">
                                Supplier Ledger
                            </div>
                            <h1 className="text-3xl font-black tracking-tight md:text-4xl">{supplier.name}</h1>
                            <p className="max-w-2xl text-sm text-white/80 md:text-base">
                                Review this supplier&apos;s category, assigned stores, payable schedules, and payment history in one place.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Link href="/admin/suppliers" className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white/90">
                                    Back to Suppliers
                                </Link>
                                <Link href="/admin/supplier-transactions" className="inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
                                    Transactions
                                </Link>
                            </div>
                        </div>
                        <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:grid-cols-2">
                            <div>
                                <div className="text-xs uppercase tracking-[0.25em] text-white/60">Total Payable</div>
                                <div className="mt-2 text-3xl font-black">{formatCurrency(summary.total_payable)}</div>
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-[0.25em] text-white/60">Outstanding</div>
                                <div className="mt-2 text-3xl font-black">{formatCurrency(summary.outstanding_balance)}</div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Supplier Profile</CardTitle>
                            <CardDescription>Basic details and store assignments.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-sm text-muted-foreground">Category</div>
                                <div className="mt-1">
                                    <Badge variant="outline">{formatCategory(supplier.category)}</Badge>
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Email</div>
                                <div className="mt-1 font-medium">{supplier.email}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Phone</div>
                                <div className="mt-1 font-medium">{supplier.phone || 'Not saved'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Address</div>
                                <div className="mt-1 font-medium">{supplier.address || 'Not saved'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Assigned Stores</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {supplier.stores.length ? (
                                        supplier.stores.map((store) => (
                                            <Badge key={store.id} variant="secondary">
                                                {store.name}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-sm text-muted-foreground">No stores assigned.</span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <Card className="shadow-sm">
                            <CardHeader className="pb-2">
                                <CardDescription>Transactions</CardDescription>
                                <CardTitle className="text-3xl font-black">{summary.transactions_count}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">Total payable schedules created for this supplier.</CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardHeader className="pb-2">
                                <CardDescription>Total Paid</CardDescription>
                                <CardTitle className="text-3xl font-black">{formatCurrency(summary.total_paid)}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">All recorded supplier payments so far.</CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardHeader className="pb-2">
                                <CardDescription>Balance Remaining</CardDescription>
                                <CardTitle className="text-3xl font-black">{formatCurrency(summary.outstanding_balance)}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">Outstanding amount still pending.</CardContent>
                        </Card>
                    </div>
                </section>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Transaction History</CardTitle>
                        <CardDescription>Every payable schedule created for this supplier.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {transactions.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-muted-foreground">
                                No transactions found for this supplier yet.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Store</TableHead>
                                        <TableHead>Goods Value</TableHead>
                                        <TableHead>Total Payable</TableHead>
                                        <TableHead>Progress</TableHead>
                                        <TableHead>Remaining</TableHead>
                                        <TableHead>Next Due</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((transaction) => (
                                        <TableRow key={transaction.id}>
                                            <TableCell>{transaction.created_at ? new Date(transaction.created_at).toLocaleDateString() : '-'}</TableCell>
                                            <TableCell>{transaction.store?.name ?? 'Unassigned'}</TableCell>
                                            <TableCell>{formatCurrency(transaction.goods_value)}</TableCell>
                                            <TableCell>{formatCurrency(transaction.total_payable)}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {transaction.paid_installments}/{transaction.total_installments}
                                                </div>
                                                <div className="text-xs text-muted-foreground">{Math.round(transaction.progress_percentage)}%</div>
                                            </TableCell>
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
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Payment History</CardTitle>
                        <CardDescription>All installment payments made to this supplier.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {payments.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-muted-foreground">
                                No payments recorded for this supplier yet.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Store</TableHead>
                                        <TableHead>Transaction</TableHead>
                                        <TableHead>Installment</TableHead>
                                        <TableHead>Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell>{new Date(payment.paid_at).toLocaleDateString()}</TableCell>
                                            <TableCell>{payment.transaction.store?.name ?? 'Unassigned'}</TableCell>
                                            <TableCell>#{payment.transaction.id}</TableCell>
                                            <TableCell>
                                                {payment.installment_number}/{payment.transaction.total_installments}
                                            </TableCell>
                                            <TableCell>{formatCurrency(payment.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
