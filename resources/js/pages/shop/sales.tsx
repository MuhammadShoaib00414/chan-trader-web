import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToastStack } from '@/components/ui/toast-stack';
import AppLayout from '@/layouts/app-layout';
import { postJson } from '@/lib/http';
import { Head, router } from '@inertiajs/react';
import { Plus, ReceiptText, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

type ProductRef = {
    id: number;
    name: string;
    sku: string;
    price: number;
    purchase_price: number;
    stock: number;
    low_stock_threshold: number;
};

type CustomerRef = {
    id: number;
    name: string;
    phone: string | null;
    address: string | null;
};

type SaleItem = {
    id: number;
    bill_no: string;
    sale_date: string;
    customer: { id: number; name: string; phone: string | null } | null;
    subtotal: number;
    received_amount: number;
    balance_due: number;
    profit_amount: number;
    payment_status: string;
    notes: string | null;
    created_at: string;
    items: Array<{
        id: number;
        product_name: string;
        sku: string | null;
        quantity: number;
        unit_price: number;
        line_total: number;
    }>;
    payments: Array<{
        id: number;
        amount: number;
        method: string;
        payment_date: string;
    }>;
};

type SalesPageProps = {
    products: ProductRef[];
    customers: CustomerRef[];
    sales: SaleItem[];
};

type DraftLine = {
    product_id: number;
    quantity: string;
    unit_price: string;
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        maximumFractionDigits: 0,
    }).format(amount ?? 0);

const blankLine = (): DraftLine => ({
    product_id: 0,
    quantity: '1',
    unit_price: '',
});

export default function ShopSales({ products, customers, sales }: SalesPageProps) {
    const [selectedCustomerId, setSelectedCustomerId] = useState(0);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [lines, setLines] = useState<DraftLine[]>([blankLine()]);
    const [receivedAmount, setReceivedAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [activeSale, setActiveSale] = useState<SaleItem | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethodDialog, setPaymentMethodDialog] = useState('cash');
    const [paymentNote, setPaymentNote] = useState('');
    const [toasts, setToasts] = useState<Array<{ id: number; title: string; variant: 'success' | 'error' }>>([]);

    const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

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

    const updateLine = (index: number, updates: Partial<DraftLine>) => {
        setLines((current) =>
            current.map((line, currentIndex) => {
                if (currentIndex !== index) return line;
                const next = { ...line, ...updates };
                if ('product_id' in updates) {
                    const product = productMap.get(Number(updates.product_id));
                    next.unit_price = product ? String(product.price) : '';
                }
                return next;
            }),
        );
    };

    const addLine = () => setLines((current) => [...current, blankLine()]);
    const removeLine = (index: number) => setLines((current) => current.filter((_, currentIndex) => currentIndex !== index));

    const totals = lines.reduce(
        (summary, line) => {
            const product = productMap.get(Number(line.product_id));
            const quantity = Number(line.quantity || 0);
            const unitPrice = Number(line.unit_price || product?.price || 0);
            const unitCost = Number(product?.purchase_price || 0);
            const total = quantity * unitPrice;
            const profit = quantity * (unitPrice - unitCost);

            return {
                subtotal: summary.subtotal + total,
                profit: summary.profit + profit,
            };
        },
        { subtotal: 0, profit: 0 },
    );

    const dueAmount = Math.max(0, totals.subtotal - Number(receivedAmount || 0));

    const submitSale = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);

        const payload = {
            customer_id: selectedCustomerId || null,
            customer_name: selectedCustomerId ? null : customerName || null,
            customer_phone: selectedCustomerId ? null : customerPhone || null,
            customer_address: selectedCustomerId ? null : customerAddress || null,
            received_amount: receivedAmount ? Number(receivedAmount) : 0,
            payment_method: paymentMethod,
            notes: notes || null,
            items: lines
                .filter((line) => line.product_id && Number(line.quantity) > 0)
                .map((line) => ({
                    product_id: Number(line.product_id),
                    quantity: Number(line.quantity),
                    unit_price: Number(line.unit_price || productMap.get(Number(line.product_id))?.price || 0),
                })),
        };

        const res = await postJson('/api/shop/sales', payload);
        setSubmitting(false);

        if (!res.ok) {
            showToast(await extractMessage(res), 'error');
            return;
        }

        setSelectedCustomerId(0);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerAddress('');
        setLines([blankLine()]);
        setReceivedAmount('');
        setPaymentMethod('cash');
        setNotes('');
        showToast('Sale recorded successfully.', 'success');
        router.reload({ only: ['sales', 'products', 'customers'] });
    };

    const openPaymentDialog = (sale: SaleItem) => {
        setActiveSale(sale);
        setPaymentAmount(String(sale.balance_due));
        setPaymentMethodDialog('cash');
        setPaymentNote('');
        setPaymentDialogOpen(true);
    };

    const collectPayment = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!activeSale) return;

        const res = await postJson(`/api/shop/sales/${activeSale.id}/payments`, {
            amount: Number(paymentAmount),
            method: paymentMethodDialog,
            note: paymentNote || null,
        });

        if (!res.ok) {
            showToast(await extractMessage(res), 'error');
            return;
        }

        setPaymentDialogOpen(false);
        setActiveSale(null);
        showToast('Payment collected successfully.', 'success');
        router.reload({ only: ['sales', 'customers'] });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Sales', href: '/admin/shop/sales' }]}>
            <Head title="Sales" />
            <div className="space-y-6 p-4 md:p-6">
                <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <CardTitle>Create Bill</CardTitle>
                                    <CardDescription>
                                        Add products, receive cash if available, and save due balance against a customer account.
                                    </CardDescription>
                                </div>
                                <div className="rounded-2xl bg-red-50 p-3 text-red-600">
                                    <ReceiptText className="h-5 w-5" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submitSale} className="space-y-5">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium">Existing Customer</label>
                                        <select
                                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                            value={String(selectedCustomerId)}
                                            onChange={(event) => setSelectedCustomerId(Number(event.target.value))}
                                        >
                                            <option value="0">Walk-in / new customer</option>
                                            {customers.map((customer) => (
                                                <option key={customer.id} value={customer.id}>
                                                    {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium">Received Amount</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={receivedAmount}
                                            onChange={(event) => setReceivedAmount(event.target.value)}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                {!selectedCustomerId ? (
                                    <div className="grid gap-4 rounded-2xl border bg-muted/20 p-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium">New Customer Name</label>
                                            <Input
                                                value={customerName}
                                                onChange={(event) => setCustomerName(event.target.value)}
                                                placeholder="Only required if some amount stays due"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium">Customer Mobile</label>
                                            <Input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="0300 1234567" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="mb-1.5 block text-sm font-medium">Customer Address</label>
                                            <textarea
                                                value={customerAddress}
                                                onChange={(event) => setCustomerAddress(event.target.value)}
                                                placeholder="Save address when this sale will remain on credit"
                                                className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                                            />
                                        </div>
                                    </div>
                                ) : null}

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-semibold">Bill Items</div>
                                            <div className="text-xs text-muted-foreground">Each row deducts stock and contributes to profit.</div>
                                        </div>
                                        <Button type="button" variant="outline" onClick={addLine}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Item
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        {lines.map((line, index) => {
                                            const product = productMap.get(Number(line.product_id));
                                            const availableStock = product?.stock ?? 0;
                                            const alertStock = product?.low_stock_threshold ?? 0;
                                            const lineTotal = Number(line.quantity || 0) * Number(line.unit_price || product?.price || 0);

                                            return (
                                                <div key={`${index}-${line.product_id}`} className="grid gap-3 rounded-2xl border p-4 md:grid-cols-[1.5fr_0.6fr_0.7fr_auto]">
                                                    <div>
                                                        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                            Product
                                                        </label>
                                                        <select
                                                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                                            value={String(line.product_id)}
                                                            onChange={(event) => updateLine(index, { product_id: Number(event.target.value) })}
                                                        >
                                                            <option value="0">Select product</option>
                                                            {products.map((item) => (
                                                                <option key={item.id} value={item.id}>
                                                                    {item.name} ({item.sku}) - stock {item.stock}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {product ? (
                                                            <div className="mt-2 text-xs text-muted-foreground">
                                                                Stock {availableStock} • Alert at {alertStock} • Cost {formatCurrency(product.purchase_price)}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                    <div>
                                                        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                            Qty
                                                        </label>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            value={line.quantity}
                                                            onChange={(event) => updateLine(index, { quantity: event.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                            Sale Price
                                                        </label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={line.unit_price}
                                                            onChange={(event) => updateLine(index, { unit_price: event.target.value })}
                                                        />
                                                        <div className="mt-2 text-xs font-semibold text-muted-foreground">{formatCurrency(lineTotal)}</div>
                                                    </div>
                                                    <div className="flex items-end justify-end">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            disabled={lines.length === 1}
                                                            onClick={() => removeLine(index)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="grid gap-4 rounded-2xl bg-zinc-950 p-4 text-white md:grid-cols-4">
                                    <div>
                                        <div className="text-xs uppercase tracking-[0.25em] text-zinc-400">Subtotal</div>
                                        <div className="mt-1 text-2xl font-black">{formatCurrency(totals.subtotal)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs uppercase tracking-[0.25em] text-zinc-400">Expected Profit</div>
                                        <div className="mt-1 text-2xl font-black text-emerald-400">{formatCurrency(totals.profit)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs uppercase tracking-[0.25em] text-zinc-400">Due After Sale</div>
                                        <div className="mt-1 text-2xl font-black text-amber-300">{formatCurrency(dueAmount)}</div>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs uppercase tracking-[0.25em] text-zinc-400">Payment Method</label>
                                        <select
                                            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
                                            value={paymentMethod}
                                            onChange={(event) => setPaymentMethod(event.target.value)}
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="bank">Bank</option>
                                            <option value="wallet">Wallet</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">Notes</label>
                                    <textarea
                                        value={notes}
                                        onChange={(event) => setNotes(event.target.value)}
                                        placeholder="Optional notes for this bill"
                                        className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <Button type="submit" disabled={submitting}>
                                        {submitting ? 'Saving Bill...' : 'Save Bill'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Billing Notes</CardTitle>
                            <CardDescription>How this new shop flow works</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-muted-foreground">
                            <div className="rounded-2xl border bg-muted/20 p-4">
                                If full payment is received, the bill is saved as <span className="font-semibold text-foreground">paid</span>.
                            </div>
                            <div className="rounded-2xl border bg-muted/20 p-4">
                                If any amount remains due, save or select a customer so the outstanding balance stays attached to their account.
                            </div>
                            <div className="rounded-2xl border bg-muted/20 p-4">
                                Stock is reduced immediately after saving the bill, and product cost price is used to estimate bill profit.
                            </div>
                            <div className="rounded-2xl border bg-muted/20 p-4">
                                Additional customer payments can be collected from the recent sales list below.
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Recent Sales</CardTitle>
                        <CardDescription>Auto-generated bill numbers, payment state, and pending dues</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Bill</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Received</TableHead>
                                        <TableHead>Due</TableHead>
                                        <TableHead>Profit</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sales.map((sale) => (
                                        <TableRow key={sale.id}>
                                            <TableCell>
                                                <div className="font-medium">{sale.bill_no}</div>
                                                <div className="text-xs text-muted-foreground">{sale.sale_date}</div>
                                            </TableCell>
                                            <TableCell>{sale.customer?.name ?? 'Walk-in customer'}</TableCell>
                                            <TableCell>{formatCurrency(sale.subtotal)}</TableCell>
                                            <TableCell>{formatCurrency(sale.received_amount)}</TableCell>
                                            <TableCell className={sale.balance_due > 0 ? 'font-semibold text-red-600' : ''}>
                                                {formatCurrency(sale.balance_due)}
                                            </TableCell>
                                            <TableCell>{formatCurrency(sale.profit_amount)}</TableCell>
                                            <TableCell className="capitalize">{sale.payment_status}</TableCell>
                                            <TableCell className="text-right">
                                                {sale.balance_due > 0 ? (
                                                    <Button size="sm" variant="outline" onClick={() => openPaymentDialog(sale)}>
                                                        Collect Payment
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Settled</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="grid gap-3 md:hidden">
                            {sales.map((sale) => (
                                <div key={sale.id} className="rounded-2xl border p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="font-semibold">{sale.bill_no}</div>
                                            <div className="text-xs text-muted-foreground">{sale.customer?.name ?? 'Walk-in customer'}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold">{formatCurrency(sale.subtotal)}</div>
                                            <div className="text-xs capitalize text-muted-foreground">{sale.payment_status}</div>
                                        </div>
                                    </div>
                                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                                        <div>
                                            <div className="text-muted-foreground">Received</div>
                                            <div className="font-semibold">{formatCurrency(sale.received_amount)}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground">Due</div>
                                            <div className={`font-semibold ${sale.balance_due > 0 ? 'text-red-600' : ''}`}>
                                                {formatCurrency(sale.balance_due)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground">Profit</div>
                                            <div className="font-semibold">{formatCurrency(sale.profit_amount)}</div>
                                        </div>
                                    </div>
                                    {sale.balance_due > 0 ? (
                                        <div className="mt-3 flex justify-end">
                                            <Button size="sm" variant="outline" onClick={() => openPaymentDialog(sale)}>
                                                Collect Payment
                                            </Button>
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Collect Payment</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={collectPayment} className="space-y-4">
                        <div className="rounded-2xl bg-muted/30 p-4 text-sm">
                            <div className="font-semibold">{activeSale?.bill_no}</div>
                            <div className="text-muted-foreground">{activeSale?.customer?.name ?? 'Walk-in customer'}</div>
                            <div className="mt-2 text-red-600">Remaining due: {formatCurrency(activeSale?.balance_due ?? 0)}</div>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium">Amount</label>
                            <Input type="number" min="0.01" step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} required />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium">Method</label>
                            <select
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                value={paymentMethodDialog}
                                onChange={(event) => setPaymentMethodDialog(event.target.value)}
                            >
                                <option value="cash">Cash</option>
                                <option value="bank">Bank</option>
                                <option value="wallet">Wallet</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium">Note</label>
                            <Input value={paymentNote} onChange={(event) => setPaymentNote(event.target.value)} placeholder="Optional payment note" />
                        </div>
                        <DialogFooter>
                            <Button type="submit">Save Payment</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ToastStack toasts={toasts} onDismiss={dismissToast} />
        </AppLayout>
    );
}
