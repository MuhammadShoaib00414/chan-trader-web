import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';

type OutstandingSupplier = {
    name: string;
    outstanding_balance: number;
};

type UpcomingPayment = {
    supplier_name: string;
    store_name?: string | null;
    amount: number;
    due_date: string;
    week_label: string;
    is_highlighted: boolean;
};

type ChartData = {
    supplier: string;
    balance?: number;
    progress?: number;
    paid?: number;
    total?: number;
};

interface SupplierDashboardProps {
    suppliersWithOutstanding: OutstandingSupplier[];
    upcomingPayments: UpcomingPayment[];
    charts: {
        outstandingBalances: ChartData[];
        paymentProgress: ChartData[];
    };
}

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        maximumFractionDigits: 2,
    }).format(amount ?? 0);

function OutstandingBars({ data }: { data: ChartData[] }) {
    const items = data.slice(0, 6);
    const maxBalance = Math.max(...items.map((item) => item.balance ?? 0), 1);

    return (
        <div className="space-y-4">
            {items.map((item) => {
                const width = ((item.balance ?? 0) / maxBalance) * 100;

                return (
                    <div key={item.supplier} className="space-y-2">
                        <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="truncate font-medium text-slate-700">{item.supplier}</span>
                            <span className="font-semibold text-slate-900">{formatCurrency(item.balance ?? 0)}</span>
                        </div>
                        <svg viewBox="0 0 100 10" className="h-4 w-full overflow-visible">
                            <rect x="0" y="1" width="100" height="8" rx="4" fill="#e2e8f0" />
                            <rect x="0" y="1" width={width} height="8" rx="4" fill="url(#outstandingGradient)" />
                            <defs>
                                <linearGradient id="outstandingGradient" x1="0%" x2="100%">
                                    <stop offset="0%" stopColor="#f97316" />
                                    <stop offset="100%" stopColor="#facc15" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                );
            })}
        </div>
    );
}

function ProgressRings({ data }: { data: ChartData[] }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            {data.slice(0, 6).map((item) => {
                const progress = Math.max(0, Math.min(100, item.progress ?? 0));
                const radius = 28;
                const circumference = 2 * Math.PI * radius;
                const dashOffset = circumference - (progress / 100) * circumference;

                return (
                    <div key={item.supplier} className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0">
                            <circle cx="36" cy="36" r={radius} fill="none" stroke="#dbeafe" strokeWidth="8" />
                            <circle
                                cx="36"
                                cy="36"
                                r={radius}
                                fill="none"
                                stroke="#2563eb"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={dashOffset}
                                transform="rotate(-90 36 36)"
                            />
                            <text x="36" y="40" textAnchor="middle" className="fill-slate-900 text-[12px] font-bold">
                                {Math.round(progress)}%
                            </text>
                        </svg>
                        <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-900">{item.supplier}</div>
                            <div className="text-sm text-slate-500">
                                {item.paid ?? 0}/{item.total ?? 0} installments paid
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function SupplierDashboard({ suppliersWithOutstanding, upcomingPayments, charts }: SupplierDashboardProps) {
    const totalOutstanding = suppliersWithOutstanding.reduce((sum, item) => sum + item.outstanding_balance, 0);
    const highlightedPayments = upcomingPayments.filter((payment) => payment.is_highlighted).length;

    return (
        <AppLayout breadcrumbs={[{ title: 'Supplier Dashboard', href: '/admin/supplier-dashboard' }]}>
            <Head title="Supplier Dashboard" />
            <div className="space-y-6 p-4 md:p-6">
                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.15),_transparent_36%),linear-gradient(135deg,_#082f49,_#0f172a_58%,_#1d4ed8)] p-6 text-white shadow-2xl">
                    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                        <div className="space-y-3">
                            <div className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/80">
                                Payables Dashboard
                            </div>
                            <h1 className="text-3xl font-black tracking-tight md:text-4xl">See who still needs payment, what is due next, and how far each schedule has moved.</h1>
                            <p className="max-w-2xl text-sm text-white/80 md:text-base">
                                This dashboard keeps supplier balances, weekly dues, and payment progress in one operational view for shop management.
                            </p>
                        </div>
                        <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:grid-cols-2">
                            <div>
                                <div className="text-xs uppercase tracking-[0.25em] text-white/60">Outstanding</div>
                                <div className="mt-2 text-3xl font-black">{formatCurrency(totalOutstanding)}</div>
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-[0.25em] text-white/60">Highlighted Dues</div>
                                <div className="mt-2 text-3xl font-black">{highlightedPayments}</div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="flex flex-wrap gap-2">
                    <Link href="/admin/suppliers" className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
                        Suppliers
                    </Link>
                    <Link href="/admin/supplier-transactions" className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
                        Transactions
                    </Link>
                    <Link href="/admin/supplier-payments" className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
                        Payments
                    </Link>
                </div>

                <section className="grid gap-4 md:grid-cols-3">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardDescription>Suppliers Awaiting Payment</CardDescription>
                            <CardTitle className="text-3xl font-black">{suppliersWithOutstanding.length}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">Suppliers with at least one active balance.</CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardDescription>Total Outstanding Balance</CardDescription>
                            <CardTitle className="text-3xl font-black">{formatCurrency(totalOutstanding)}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">Real remaining amount after recorded payments.</CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardDescription>Upcoming Weekly Payments</CardDescription>
                            <CardTitle className="text-3xl font-black">{upcomingPayments.length}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">Open weekly installments across active schedules.</CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Outstanding Balances</CardTitle>
                            <CardDescription>Bar chart showing the heaviest supplier balances first.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {charts.outstandingBalances.length === 0 ? (
                                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-muted-foreground">
                                    No outstanding balances found.
                                </div>
                            ) : (
                                <OutstandingBars data={charts.outstandingBalances} />
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Payment Progress</CardTitle>
                            <CardDescription>Installment completion rings for active supplier schedules.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {charts.paymentProgress.length === 0 ? (
                                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-muted-foreground">
                                    No active transactions found.
                                </div>
                            ) : (
                                <ProgressRings data={charts.paymentProgress} />
                            )}
                        </CardContent>
                    </Card>
                </section>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Upcoming Weekly Payments</CardTitle>
                        <CardDescription>Overdue, current week, and next week installments are highlighted for follow-up.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {upcomingPayments.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-muted-foreground">
                                No upcoming payments scheduled.
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {upcomingPayments.map((payment, index) => (
                                    <div
                                        key={`${payment.supplier_name}-${payment.due_date}-${index}`}
                                        className={`rounded-3xl border p-4 transition ${
                                            payment.is_highlighted
                                                ? 'border-emerald-200 bg-emerald-50'
                                                : 'border-slate-200 bg-white'
                                        }`}
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <div className="font-semibold text-slate-900">{payment.supplier_name}</div>
                                                <div className="text-sm text-slate-500">
                                                    {payment.week_label} - due {new Date(payment.due_date).toLocaleDateString()}
                                                </div>
                                                {payment.store_name ? <div className="text-xs text-slate-500">Store: {payment.store_name}</div> : null}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {payment.is_highlighted ? <Badge variant="outline">Priority</Badge> : null}
                                                <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900">
                                                    {formatCurrency(payment.amount)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
