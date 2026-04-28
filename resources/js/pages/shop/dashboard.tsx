import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { AlertTriangle, Package, ReceiptText, TrendingUp, Users, Wallet } from 'lucide-react';

type DashboardProps = {
    stats: {
        today_sales: number;
        today_profit: number;
        receivables: number;
        customers_with_dues: number;
        low_stock_products: number;
        inventory_cost_value: number;
    };
    lowStockProducts: Array<{
        id: number;
        name: string;
        sku: string;
        stock: number;
        low_stock_threshold: number;
        price: number;
    }>;
    recentSales: Array<{
        id: number;
        bill_no: string;
        customer_name: string;
        subtotal: number;
        received_amount: number;
        balance_due: number;
        profit_amount: number;
        payment_status: string;
        sale_date: string;
        created_at: string;
    }>;
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        maximumFractionDigits: 0,
    }).format(amount ?? 0);

const statCards = (stats: DashboardProps['stats']) => [
    {
        title: "Today's Sales",
        value: formatCurrency(stats.today_sales),
        description: 'Total billing created today',
        icon: ReceiptText,
        tone: 'from-red-600 to-red-500',
    },
    {
        title: "Today's Profit",
        value: formatCurrency(stats.today_profit),
        description: 'Estimated margin on today sales',
        icon: TrendingUp,
        tone: 'from-zinc-900 to-zinc-700',
    },
    {
        title: 'Receivables',
        value: formatCurrency(stats.receivables),
        description: `${stats.customers_with_dues} customer accounts pending`,
        icon: Wallet,
        tone: 'from-amber-500 to-orange-500',
    },
    {
        title: 'Low Stock Alerts',
        value: String(stats.low_stock_products),
        description: 'Products at or below alert level',
        icon: AlertTriangle,
        tone: 'from-emerald-600 to-emerald-500',
    },
    {
        title: 'Inventory Cost',
        value: formatCurrency(stats.inventory_cost_value),
        description: 'Current stock value on cost price',
        icon: Package,
        tone: 'from-sky-700 to-sky-500',
    },
    {
        title: 'Customers With Due',
        value: String(stats.customers_with_dues),
        description: 'Active udhar accounts to follow up',
        icon: Users,
        tone: 'from-violet-700 to-fuchsia-600',
    },
];

export default function ShopDashboard({ stats, lowStockProducts, recentSales }: DashboardProps) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Shop Dashboard', href: '/admin/shop/dashboard' }]}>
            <Head title="Shop Dashboard" />
            <div className="space-y-6 p-4 md:p-6">
                <section className="overflow-hidden rounded-3xl border border-red-100 bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.2),_transparent_35%),linear-gradient(135deg,_#111827,_#1f2937_58%,_#7f1d1d)] p-6 text-white shadow-2xl">
                    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                        <div className="space-y-3">
                            <Badge className="bg-white/15 text-white hover:bg-white/15">Shop Management</Badge>
                            <h1 className="max-w-2xl text-3xl font-black tracking-tight md:text-4xl">
                                Daily sales, udhar accounts, low-stock alerts, and profit in one view.
                            </h1>
                            <p className="max-w-2xl text-sm text-white/80 md:text-base">
                                This dashboard is built for fast shop operations: add stock in products, create bills in sales,
                                and follow pending customer balances without jumping across modules.
                            </p>
                        </div>
                        <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                            <div>
                                <div className="text-xs uppercase tracking-[0.3em] text-white/60">Quick Snapshot</div>
                                <div className="mt-2 text-3xl font-black">{formatCurrency(stats.today_sales)}</div>
                                <div className="text-sm text-white/75">Billing created in today&apos;s trading session</div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="rounded-2xl bg-white/10 p-3">
                                    <div className="text-white/60">Profit</div>
                                    <div className="mt-1 font-bold">{formatCurrency(stats.today_profit)}</div>
                                </div>
                                <div className="rounded-2xl bg-white/10 p-3">
                                    <div className="text-white/60">Low Stock</div>
                                    <div className="mt-1 font-bold">{stats.low_stock_products}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {statCards(stats).map((card) => (
                        <Card key={card.title} className="overflow-hidden border-0 shadow-lg">
                            <div className={`h-1 bg-gradient-to-r ${card.tone}`} />
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardDescription>{card.title}</CardDescription>
                                        <CardTitle className="mt-2 text-2xl font-black">{card.value}</CardTitle>
                                    </div>
                                    <div className={`rounded-2xl bg-gradient-to-br ${card.tone} p-3 text-white`}>
                                        <card.icon className="h-5 w-5" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0 text-sm text-muted-foreground">{card.description}</CardContent>
                        </Card>
                    ))}
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Low Stock Watchlist</CardTitle>
                            <CardDescription>Products that need restocking soon</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {lowStockProducts.length === 0 ? (
                                <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                                    No low-stock items right now.
                                </div>
                            ) : (
                                lowStockProducts.map((product) => (
                                    <div key={product.id} className="flex items-center justify-between rounded-2xl border bg-muted/30 p-4">
                                        <div>
                                            <div className="font-semibold">{product.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                SKU: {product.sku} • Alert at {product.low_stock_threshold}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-black text-red-600">{product.stock}</div>
                                            <div className="text-xs text-muted-foreground">{formatCurrency(product.price)}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Recent Bills</CardTitle>
                            <CardDescription>Latest sales with payment and due status</CardDescription>
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
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentSales.map((sale) => (
                                            <TableRow key={sale.id}>
                                                <TableCell className="font-medium">{sale.bill_no}</TableCell>
                                                <TableCell>{sale.customer_name}</TableCell>
                                                <TableCell>{formatCurrency(sale.subtotal)}</TableCell>
                                                <TableCell>{formatCurrency(sale.received_amount)}</TableCell>
                                                <TableCell>{formatCurrency(sale.balance_due)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={sale.balance_due > 0 ? 'secondary' : 'default'}>{sale.payment_status}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="grid gap-3 md:hidden">
                                {recentSales.map((sale) => (
                                    <div key={sale.id} className="rounded-2xl border p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="font-semibold">{sale.bill_no}</div>
                                                <div className="text-xs text-muted-foreground">{sale.customer_name}</div>
                                            </div>
                                            <Badge variant={sale.balance_due > 0 ? 'secondary' : 'default'}>{sale.payment_status}</Badge>
                                        </div>
                                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                                            <div>
                                                <div className="text-muted-foreground">Total</div>
                                                <div className="font-semibold">{formatCurrency(sale.subtotal)}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Received</div>
                                                <div className="font-semibold">{formatCurrency(sale.received_amount)}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Due</div>
                                                <div className="font-semibold">{formatCurrency(sale.balance_due)}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}
