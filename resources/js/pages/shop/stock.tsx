import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToastStack } from '@/components/ui/toast-stack';
import AppLayout from '@/layouts/app-layout';
import { delJson, patchJson, postJson } from '@/lib/http';
import { Head, router } from '@inertiajs/react';
import { PencilLine, Plus, Trash2, Warehouse } from 'lucide-react';
import { useState } from 'react';

type StockItem = {
    id: number;
    item_name: string;
    purchase_price: number;
    selling_price: number;
    profit_margin: number;
    created_at: string;
    updated_at: string;
};

type StockPageProps = {
    stockItems: StockItem[];
    stats: {
        total_items: number;
        avg_purchase_price: number;
        avg_selling_price: number;
        potential_margin: number;
    };
};

type StockForm = {
    item_name: string;
    purchase_price: string;
    selling_price: string;
};

const emptyForm: StockForm = {
    item_name: '',
    purchase_price: '',
    selling_price: '',
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        maximumFractionDigits: 0,
    }).format(amount ?? 0);

export default function ShopStock({ stockItems, stats }: StockPageProps) {
    const [form, setForm] = useState<StockForm>(emptyForm);
    const [editingItem, setEditingItem] = useState<StockItem | null>(null);
    const [editForm, setEditForm] = useState<StockForm>(emptyForm);
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

    const syncField = (key: keyof StockForm, value: string) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const syncEditField = (key: keyof StockForm, value: string) => {
        setEditForm((current) => ({ ...current, [key]: value }));
    };

    const createStockItem = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);

        const res = await postJson('/api/shop/stock', {
            item_name: form.item_name,
            purchase_price: Number(form.purchase_price || 0),
            selling_price: Number(form.selling_price || 0),
        });

        setSubmitting(false);

        if (!res.ok) {
            showToast(await extractMessage(res), 'error');
            return;
        }

        setForm(emptyForm);
        showToast('Stock item saved successfully.', 'success');
        router.reload({ only: ['stockItems', 'stats'] });
    };

    const openEditDialog = (item: StockItem) => {
        setEditingItem(item);
        setEditForm({
            item_name: item.item_name,
            purchase_price: String(item.purchase_price),
            selling_price: String(item.selling_price),
        });
    };

    const updateStockItem = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editingItem) return;

        setSubmitting(true);

        const res = await patchJson(`/api/shop/stock/${editingItem.id}`, {
            item_name: editForm.item_name,
            purchase_price: Number(editForm.purchase_price || 0),
            selling_price: Number(editForm.selling_price || 0),
        });

        setSubmitting(false);

        if (!res.ok) {
            showToast(await extractMessage(res), 'error');
            return;
        }

        setEditingItem(null);
        showToast('Stock item updated successfully.', 'success');
        router.reload({ only: ['stockItems', 'stats'] });
    };

    const deleteStockItem = async (item: StockItem) => {
        if (!window.confirm(`Delete "${item.item_name}" from stock records?`)) {
            return;
        }

        const res = await delJson(`/api/shop/stock/${item.id}`);
        if (!res.ok) {
            showToast(await extractMessage(res), 'error');
            return;
        }

        showToast('Stock item deleted successfully.', 'success');
        router.reload({ only: ['stockItems', 'stats'] });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Stock Management', href: '/admin/shop/stock' }]}>
            <Head title="Stock Management" />
            <div className="space-y-6 p-4 md:p-6">
                <section className="overflow-hidden rounded-3xl border border-amber-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.22),_transparent_38%),linear-gradient(135deg,_#111827,_#1f2937_54%,_#92400e)] p-6 text-white shadow-2xl">
                    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                        <div className="space-y-3">
                            <Badge className="bg-white/15 text-white hover:bg-white/15">Stock Management</Badge>
                            <h1 className="max-w-2xl text-3xl font-black tracking-tight md:text-4xl">
                                Maintain article pricing in a fast stock register built for the same shop workflow.
                            </h1>
                            <p className="max-w-2xl text-sm text-white/80 md:text-base">
                                Add item names with purchase and selling rates, review margin at a glance, and keep this list
                                separate from the broader catalog module.
                            </p>
                        </div>
                        <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                            <div>
                                <div className="text-xs uppercase tracking-[0.3em] text-white/60">Stock Snapshot</div>
                                <div className="mt-2 text-3xl font-black">{stats.total_items}</div>
                                <div className="text-sm text-white/75">Articles currently registered in this module</div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="rounded-2xl bg-white/10 p-3">
                                    <div className="text-white/60">Avg. Purchase</div>
                                    <div className="mt-1 font-bold">{formatCurrency(stats.avg_purchase_price)}</div>
                                </div>
                                <div className="rounded-2xl bg-white/10 p-3">
                                    <div className="text-white/60">Avg. Selling</div>
                                    <div className="mt-1 font-bold">{formatCurrency(stats.avg_selling_price)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card className="overflow-hidden border-0 shadow-lg">
                        <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                        <CardHeader className="pb-2">
                            <CardDescription>Total Items</CardDescription>
                            <CardTitle className="text-2xl font-black">{stats.total_items}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-sm text-muted-foreground">Distinct stock records added in this module.</CardContent>
                    </Card>
                    <Card className="overflow-hidden border-0 shadow-lg">
                        <div className="h-1 bg-gradient-to-r from-zinc-900 to-zinc-700" />
                        <CardHeader className="pb-2">
                            <CardDescription>Average Purchase</CardDescription>
                            <CardTitle className="text-2xl font-black">{formatCurrency(stats.avg_purchase_price)}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-sm text-muted-foreground">Mean buying rate across all articles.</CardContent>
                    </Card>
                    <Card className="overflow-hidden border-0 shadow-lg">
                        <div className="h-1 bg-gradient-to-r from-sky-700 to-sky-500" />
                        <CardHeader className="pb-2">
                            <CardDescription>Average Selling</CardDescription>
                            <CardTitle className="text-2xl font-black">{formatCurrency(stats.avg_selling_price)}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-sm text-muted-foreground">Mean asking rate saved for active stock records.</CardContent>
                    </Card>
                    <Card className="overflow-hidden border-0 shadow-lg">
                        <div className="h-1 bg-gradient-to-r from-emerald-600 to-emerald-500" />
                        <CardHeader className="pb-2">
                            <CardDescription>Potential Margin</CardDescription>
                            <CardTitle className="text-2xl font-black">{formatCurrency(stats.potential_margin)}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-sm text-muted-foreground">Aggregate spread between selling and purchase rates.</CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <CardTitle>Add Stock Detail</CardTitle>
                                    <CardDescription>Save article pricing with the fields requested for daily shop handling.</CardDescription>
                                </div>
                                <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                                    <Warehouse className="h-5 w-5" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={createStockItem} className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">Item / Article Name</label>
                                    <Input
                                        value={form.item_name}
                                        onChange={(event) => syncField('item_name', event.target.value)}
                                        placeholder="e.g. Premier Cement - 50kg"
                                        required
                                    />
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium">Purchase Price</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={form.purchase_price}
                                            onChange={(event) => syncField('purchase_price', event.target.value)}
                                            placeholder="0"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium">Selling Price</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={form.selling_price}
                                            onChange={(event) => syncField('selling_price', event.target.value)}
                                            placeholder="0"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={submitting}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        {submitting ? 'Saving...' : 'Save Stock Detail'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Latest Price Register</CardTitle>
                            <CardDescription>Quick review of purchase, selling, and margin values saved in this module.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {stockItems.length === 0 ? (
                                <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                                    No stock entries added yet.
                                </div>
                            ) : (
                                stockItems.slice(0, 6).map((item) => (
                                    <div key={item.id} className="rounded-2xl border bg-muted/20 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="font-semibold">{item.item_name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Purchase {formatCurrency(item.purchase_price)} • Selling {formatCurrency(item.selling_price)}
                                                </div>
                                            </div>
                                            <Badge variant={item.profit_margin >= 0 ? 'default' : 'destructive'}>
                                                {formatCurrency(item.profit_margin)}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </section>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Stock List</CardTitle>
                        <CardDescription>Manage all saved stock details from a single table.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item / Article</TableHead>
                                        <TableHead>Purchase Price</TableHead>
                                        <TableHead>Selling Price</TableHead>
                                        <TableHead>Margin</TableHead>
                                        <TableHead>Updated</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stockItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.item_name}</TableCell>
                                            <TableCell>{formatCurrency(item.purchase_price)}</TableCell>
                                            <TableCell>{formatCurrency(item.selling_price)}</TableCell>
                                            <TableCell className={item.profit_margin >= 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-red-600'}>
                                                {formatCurrency(item.profit_margin)}
                                            </TableCell>
                                            <TableCell>{new Date(item.updated_at).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-2">
                                                    <Button type="button" variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                                                        <PencilLine className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </Button>
                                                    <Button type="button" variant="destructive" size="sm" onClick={() => deleteStockItem(item)}>
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="grid gap-3 md:hidden">
                            {stockItems.map((item) => (
                                <div key={item.id} className="rounded-2xl border p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="font-semibold">{item.item_name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                Updated {new Date(item.updated_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <Badge variant={item.profit_margin >= 0 ? 'default' : 'destructive'}>
                                            {formatCurrency(item.profit_margin)}
                                        </Badge>
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <div className="text-muted-foreground">Purchase</div>
                                            <div className="font-semibold">{formatCurrency(item.purchase_price)}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground">Selling</div>
                                            <div className="font-semibold">{formatCurrency(item.selling_price)}</div>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(item)}>
                                            Edit
                                        </Button>
                                        <Button type="button" variant="destructive" size="sm" className="flex-1" onClick={() => deleteStockItem(item)}>
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={editingItem !== null} onOpenChange={(open) => !open && setEditingItem(null)}>
                <DialogContent>
                    <form onSubmit={updateStockItem} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>Edit Stock Detail</DialogTitle>
                        </DialogHeader>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium">Item / Article Name</label>
                            <Input
                                value={editForm.item_name}
                                onChange={(event) => syncEditField('item_name', event.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">Purchase Price</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editForm.purchase_price}
                                    onChange={(event) => syncEditField('purchase_price', event.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">Selling Price</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editForm.selling_price}
                                    onChange={(event) => syncEditField('selling_price', event.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditingItem(null)} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Update Stock Detail'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ToastStack toasts={toasts} onDismiss={dismissToast} />
        </AppLayout>
    );
}
