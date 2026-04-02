import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CreditCard, KeyRound, Package, Shield, ShoppingCart, Store, Truck, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface DashboardProps {
    stats: {
        users?: number;
        roles?: number;
        permissions?: number;
        stores?: number;
        products?: number;
        orders?: number;
        pending_orders?: number;
        payments?: number;
        shipments?: number;
        my_products?: number;
        my_orders?: number;
        my_payments?: number;
        my_shipments?: number;
        sales?: {
            today: number;
            week: number;
            month: number;
            year: number;
        };
    };
    recentUsers: Array<{
        id: number;
        name: string;
        email: string;
        created_at: string;
    }>;
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
};

const SectionHeader = ({ icon: Icon, title, subtitle, color }: { icon: any; title: string; subtitle: string; color: string }) => (
    <div className="flex items-center gap-3 mb-2 mt-4">
        <div className={`p-2 rounded-lg shadow-sm ${color}`}>
            <Icon className="h-5 w-5" />
        </div>
        <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h2>
            <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
    </div>
);

const StatCard = ({ label, value, subLabel, icon: Icon, colorClass, borderClass, textClass, bgClass, isLarge = false }: any) => (
    <motion.div variants={item}>
        <Card className={`relative overflow-hidden shadow-md bg-white dark:bg-slate-900 border-0 border-t-4 ${borderClass} transition-all hover:shadow-xl ${isLarge ? 'md:scale-[1.02] z-10' : ''}`}>
            {/* Decorative shape */}
            <div className={`absolute -right-4 -top-4 ${isLarge ? 'h-28 w-32' : 'h-20 w-24'} rounded-full ${bgClass} opacity-10 blur-2xl`} />
            
            <CardHeader className={`pb-1 px-5 ${isLarge ? 'pt-4' : 'pt-3'}`}>
                <div className={`${isLarge ? 'w-11 h-11' : 'w-9 h-9'} rounded-lg flex items-center justify-center mb-3 shadow-sm ${colorClass}`}>
                    <Icon className={`${isLarge ? 'h-5 w-5' : 'h-4 w-4'} text-white`} />
                </div>
                <CardDescription className={`${isLarge ? 'text-xs' : 'text-[10px]'} font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400`}>
                    {label}
                </CardDescription>
            </CardHeader>
            <CardContent className={`px-5 ${isLarge ? 'pb-5' : 'pb-4'}`}>
                <div className={`${isLarge ? 'text-3xl' : 'text-2xl'} font-black tracking-tight mb-1 ${textClass}`}>
                    {value}
                </div>
                <div className={`${isLarge ? 'text-[10px]' : 'text-[9px]'} font-medium text-slate-400 dark:text-slate-500 uppercase`}>
                    {subLabel}
                </div>
            </CardContent>
        </Card>
    </motion.div>
);

export default function Dashboard({ stats, recentUsers }: DashboardProps) {
    const { props } = usePage<SharedData>();
    const roles = (props.auth as any)?.roles ?? [];
    const isSuper = Array.isArray(roles) && roles.includes('super-admin');
    const isVendor = Array.isArray(roles) && roles.includes('vendor');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <motion.div variants={container} initial="hidden" animate="show" className="flex h-full flex-1 flex-col gap-6 p-6 bg-white dark:bg-black">
                
                {/* Sales & Financial Section */}
                {(isSuper || isVendor) && stats.sales && (
                    <div className="space-y-4">
                        <SectionHeader 
                            icon={CreditCard} 
                            title="Financial Overview" 
                            subtitle="Revenue tracking and performance"
                            color="bg-red-600 text-white"
                        />
                        <motion.div variants={container} className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard 
                                label="Today's Sales" 
                                value={formatCurrency(stats.sales.today)} 
                                subLabel="Generated today"
                                icon={CreditCard}
                                colorClass="bg-red-600"
                                borderClass="border-t-red-600"
                                textClass="text-red-600"
                                bgClass="bg-red-600"
                                isLarge={true}
                            />
                            <StatCard 
                                label="Weekly Sales" 
                                value={formatCurrency(stats.sales.week)} 
                                subLabel="Revenue this week"
                                icon={CreditCard}
                                colorClass="bg-zinc-900"
                                borderClass="border-t-zinc-900"
                                textClass="text-zinc-900 dark:text-zinc-100"
                                bgClass="bg-zinc-900"
                                isLarge={true}
                            />
                            <StatCard 
                                label="Monthly Sales" 
                                value={formatCurrency(stats.sales.month)} 
                                subLabel="Revenue this month"
                                icon={CreditCard}
                                colorClass="bg-red-700"
                                borderClass="border-t-red-700"
                                textClass="text-red-700"
                                bgClass="bg-red-700"
                                isLarge={true}
                            />
                            <StatCard 
                                label="Yearly Sales" 
                                value={formatCurrency(stats.sales.year)} 
                                subLabel="Annual revenue"
                                icon={CreditCard}
                                colorClass="bg-zinc-800"
                                borderClass="border-t-zinc-800"
                                textClass="text-zinc-800 dark:text-zinc-200"
                                bgClass="bg-zinc-800"
                                isLarge={true}
                            />
                        </motion.div>
                    </div>
                )}

                {/* User & Access Management Section */}
                {!isVendor && (
                    <div className="space-y-4">
                        <SectionHeader 
                            icon={Users} 
                            title="User Management" 
                            subtitle="User metrics and system access"
                            color="bg-zinc-900 text-white"
                        />
                        <motion.div variants={container} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <StatCard 
                                label="Total Customers" 
                                value={stats.users ?? 0} 
                                subLabel="Registered users"
                                icon={Users}
                                colorClass="bg-red-600"
                                borderClass="border-t-red-600"
                                textClass="text-red-600"
                                bgClass="bg-red-600"
                                isLarge={true}
                            />
                            <StatCard 
                                label="Defined Roles" 
                                value={stats.roles ?? 0} 
                                subLabel="Access control roles"
                                icon={Shield}
                                colorClass="bg-zinc-900"
                                borderClass="border-t-zinc-900"
                                textClass="text-zinc-900 dark:text-zinc-100"
                                bgClass="bg-zinc-900"
                                isLarge={true}
                            />
                            <StatCard 
                                label="System Permissions" 
                                value={stats.permissions ?? 0} 
                                subLabel="Access levels"
                                icon={KeyRound}
                                colorClass="bg-red-700"
                                borderClass="border-t-red-700"
                                textClass="text-red-700"
                                bgClass="bg-red-700"
                                isLarge={true}
                            />
                        </motion.div>
                    </div>
                )}

                {/* Catalog & Operations Section */}
                {isSuper && (
                    <div className="space-y-4">
                        <SectionHeader 
                            icon={Package} 
                            title="Inventory & Orders" 
                            subtitle="Stores, products, and fulfillment"
                            color="bg-red-600 text-white"
                        />
                        <motion.div variants={container} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <StatCard 
                                label="Total Stores" 
                                value={stats.stores ?? 0} 
                                subLabel="Registered vendors"
                                icon={Store}
                                colorClass="bg-zinc-900"
                                borderClass="border-t-zinc-900"
                                textClass="text-zinc-900 dark:text-zinc-100"
                                bgClass="bg-zinc-900"
                                isLarge={true}
                            />
                            <StatCard 
                                label="Total Products" 
                                value={stats.products ?? 0} 
                                subLabel="Across all stores"
                                icon={Package}
                                colorClass="bg-red-600"
                                borderClass="border-t-red-600"
                                textClass="text-red-600"
                                bgClass="bg-red-600"
                                isLarge={true}
                            />
                            <StatCard 
                                label="Total Orders" 
                                value={stats.orders ?? 0} 
                                subLabel={`${stats.pending_orders ?? 0} pending`}
                                icon={ShoppingCart}
                                colorClass="bg-zinc-800"
                                borderClass="border-t-zinc-800"
                                textClass="text-zinc-800 dark:text-zinc-200"
                                bgClass="bg-zinc-800"
                                isLarge={true}
                            />
                        </motion.div>
                    </div>
                )}

                {/* Vendor Store Section */}
                {isVendor && (
                    <div className="space-y-4">
                        <SectionHeader 
                            icon={Store} 
                            title="Store Insights" 
                            subtitle="Manage your store products and order fulfillment"
                            color="bg-red-600 text-white"
                        />
                        <motion.div variants={container} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <StatCard 
                                label="My Products" 
                                value={stats.my_products ?? 0} 
                                subLabel="Items in your inventory"
                                icon={Package}
                                colorClass="bg-red-600"
                                borderClass="border-t-red-600"
                                textClass="text-red-600"
                                bgClass="bg-red-600"
                            />
                            <StatCard 
                                label="My Orders" 
                                value={stats.my_orders ?? 0} 
                                subLabel={`${stats.pending_orders ?? 0} pending`}
                                icon={ShoppingCart}
                                colorClass="bg-zinc-900"
                                borderClass="border-t-zinc-900"
                                textClass="text-zinc-900 dark:text-zinc-100"
                                bgClass="bg-zinc-900"
                            />
                            <StatCard 
                                label="Payments" 
                                value={stats.my_payments ?? 0} 
                                subLabel="Settled transactions"
                                icon={CreditCard}
                                colorClass="bg-red-700"
                                borderClass="border-t-red-700"
                                textClass="text-red-700"
                                bgClass="bg-red-700"
                            />
                            <StatCard 
                                label="Shipments" 
                                value={stats.my_shipments ?? 0} 
                                subLabel="Items dispatched"
                                icon={Truck}
                                colorClass="bg-zinc-800"
                                borderClass="border-t-zinc-800"
                                textClass="text-zinc-800 dark:text-zinc-200"
                                bgClass="bg-zinc-800"
                            />
                        </motion.div>
                    </div>
                )}

                {/* Table Section */}
                <motion.div variants={item} className="mt-6 mb-2">
                    <Card className="shadow-xl overflow-hidden bg-white dark:bg-zinc-950 border-0 border-t-4 border-t-red-600">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-4">
                            <div>
                                <CardTitle className="text-xl font-black text-zinc-900 dark:text-white">Recent Customers</CardTitle>
                                <CardDescription>Latest users who joined the platform</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" className="rounded-full px-6 font-bold border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-all">View All</Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="w-full overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                                            <TableHead className="font-bold py-4 pl-8 uppercase text-[10px] tracking-widest text-red-600">Customer Name</TableHead>
                                            <TableHead className="hidden font-bold py-4 uppercase text-[10px] tracking-widest text-red-600 sm:table-cell">Email Address</TableHead>
                                            <TableHead className="text-right font-bold py-4 pr-8 uppercase text-[10px] tracking-widest text-red-600">Joined Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentUsers.map((u) => (
                                            <TableRow key={u.id} className="hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors border-b border-zinc-100 dark:border-zinc-900">
                                                <TableCell className="py-4 pl-8 font-bold text-zinc-800 dark:text-zinc-200">{u.name}</TableCell>
                                                <TableCell className="hidden py-4 text-zinc-500 dark:text-zinc-400 sm:table-cell">{u.email}</TableCell>
                                                <TableCell className="text-right py-4 pr-8 text-zinc-400 dark:text-zinc-500 font-medium">
                                                    {new Date(u.created_at).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {recentUsers.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="h-32 text-center text-zinc-400 italic">
                                                    No new users found in the system
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}
