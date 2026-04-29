import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToastStack } from '@/components/ui/toast-stack';
import AppLayout from '@/layouts/app-layout';
import { postJson } from '@/lib/http';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

type CustomerItem = {
    id: number;
    name: string;
    phone: string | null;
    address: string | null;
    notes: string | null;
    sales_count: number;
    outstanding_balance: number;
    created_at: string;
};

type CreditSaleItem = {
    id: number;
    bill_no: string;
    customer_name: string;
    subtotal: number;
    received_amount: number;
    balance_due: number;
    sale_date: string;
};

type CustomersPageProps = {
    customers: CustomerItem[];
    recentCreditSales: CreditSaleItem[];
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        maximumFractionDigits: 0,
    }).format(amount ?? 0);

export default function ShopCustomers({ customers, recentCreditSales }: CustomersPageProps) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [toasts, setToasts] = useState<Array<{ id: number; title: string; variant: 'success' | 'error' }>>([]);

    const dismissToast = (id: number) => setToasts((current) => current.filter((toast) => toast.id !== id));
    const showToast = (title: string, variant: 'success' | 'error') => {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        setToasts((current) => [...current, { id, title, variant }]);
        window.setTimeout(() => dismissToast(id), 2500);
    };

    const extractMessage = async (res: Response) => {
        try {
            const payload = (await res.json()) as { message?: string; errors?: Record<string, string[]> };
            if (payload.message) return payload.message;
            const firstError = payload.errors ? Object.values(payload.errors).flat()[0] : null;
            return firstError ?? `Request failed (${res.status})`;
        } catch {
            return `Request failed (${res.status})`;
        }
    };

    const createCustomer = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);

        const res = await postJson('/api/shop/customers', {
            name,
            phone: phone || null,
            address: address || null,
            notes: notes || null,
        });

        setSubmitting(false);

        if (!res.ok) {
            showToast(await extractMessage(res), 'error');
            return;
        }

        setName('');
        setPhone('');
        setAddress('');
        setNotes('');
        showToast('Customer saved successfully.', 'success');
        router.reload({ only: ['customers', 'recentCreditSales'] });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Customers', href: '/admin/shop/customers' }]}>
            <Head title="Customers" />
            <div className="space-y-6 p-4 md:p-6">
                <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Add Customer Account</CardTitle>
                            <CardDescription>
                                Use this for customers who buy on credit so name, phone, and address stay saved with bills.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={createCustomer} className="grid gap-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">Customer Name</label>
                                    <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Muhammad Ali Traders" required />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">Mobile Number</label>
                                    <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0300 1234567" />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">Full Address</label>
                                    <textarea
                                        value={address}
                                        onChange={(event) => setAddress(event.target.value)}
                                        placeholder="Complete shop or home address"
                                        className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">Notes</label>
                                    <textarea
                                        value={notes}
                                        onChange={(event) => setNotes(event.target.value)}
                                        placeholder="Optional notes about this customer"
                                        className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={submitting}>
                                        {submitting ? 'Saving...' : 'Save Customer'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Recent Credit Bills</CardTitle>
                            <CardDescription>Quick follow-up list for pending udhar</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recentCreditSales.length === 0 ? (
                                <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                                    No pending credit sales right now.
                                </div>
                            ) : (
                                recentCreditSales.map((sale) => (
                                    <div key={sale.id} className="rounded-2xl border bg-muted/20 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="font-semibold">{sale.bill_no}</div>
                                                <div className="text-xs text-muted-foreground">{sale.customer_name}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-red-600">{formatCurrency(sale.balance_due)}</div>
                                                <div className="text-xs text-muted-foreground">Due</div>
                                            </div>
                                        </div>
                                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                                            <div>
                                                <div className="text-muted-foreground">Bill</div>
                                                <div className="font-semibold">{formatCurrency(sale.subtotal)}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Received</div>
                                                <div className="font-semibold">{formatCurrency(sale.received_amount)}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Date</div>
                                                <div className="font-semibold">{sale.sale_date}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </section>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Customer Ledger Directory</CardTitle>
                        <CardDescription>All customer accounts with bill count and current outstanding balance</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Address</TableHead>
                                        <TableHead>Bills</TableHead>
                                        <TableHead>Outstanding</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customers.map((customer) => (
                                        <TableRow key={customer.id}>
                                            <TableCell>
                                                <div className="font-medium">{customer.name}</div>
                                                {customer.notes ? (
                                                    <div className="text-xs text-muted-foreground">{customer.notes}</div>
                                                ) : null}
                                            </TableCell>
                                            <TableCell>{customer.phone ?? '—'}</TableCell>
                                            <TableCell className="max-w-sm truncate">{customer.address ?? '—'}</TableCell>
                                            <TableCell>{customer.sales_count}</TableCell>
                                            <TableCell className={customer.outstanding_balance > 0 ? 'font-semibold text-red-600' : ''}>
                                                {formatCurrency(customer.outstanding_balance)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="grid gap-3 md:hidden">
                            {customers.map((customer) => (
                                <div key={customer.id} className="rounded-2xl border p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="font-semibold">{customer.name}</div>
                                            <div className="text-xs text-muted-foreground">{customer.phone ?? 'No phone saved'}</div>
                                        </div>
                                        <div className={customer.outstanding_balance > 0 ? 'font-semibold text-red-600' : 'font-semibold'}>
                                            {formatCurrency(customer.outstanding_balance)}
                                        </div>
                                    </div>
                                    {customer.address ? (
                                        <div className="mt-3 text-sm text-muted-foreground">{customer.address}</div>
                                    ) : null}
                                    <div className="mt-3 text-xs text-muted-foreground">Bills: {customer.sales_count}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <ToastStack toasts={toasts} onDismiss={dismissToast} />
        </AppLayout>
    );
}
