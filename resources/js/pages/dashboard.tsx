import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Users, Shield, KeyRound, Store, Package, ShoppingCart, CreditCard, Truck } from 'lucide-react';

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
        payments?: number;
        shipments?: number;
        my_products?: number;
        my_orders?: number;
        my_payments?: number;
        my_shipments?: number;
    };
    recentUsers: Array<{
        id: number;
        name: string;
        email: string;
        created_at: string;
    }>;
}

export default function Dashboard({ stats, recentUsers }: DashboardProps) {
    const { props } = usePage<SharedData>();
    const roles = (props.auth as any)?.roles ?? [];
    const isSuper = Array.isArray(roles) && roles.includes('super-admin');
    const isVendor = Array.isArray(roles) && roles.includes('vendor');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {!isVendor && (
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                <Users className="h-5 w-5 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-semibold">{stats.users ?? 0}</div>
                                <CardDescription>Active user accounts</CardDescription>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-medium">Roles</CardTitle>
                                <Shield className="h-5 w-5 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-semibold">{stats.roles ?? 0}</div>
                                <CardDescription>Defined roles</CardDescription>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-medium">Permissions</CardTitle>
                                <KeyRound className="h-5 w-5 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-semibold">{stats.permissions ?? 0}</div>
                                <CardDescription>Available permissions</CardDescription>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {isSuper && (
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-medium">Stores</CardTitle>
                                <Store className="h-5 w-5 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-semibold">{stats.stores ?? 0}</div>
                                <CardDescription>Total stores</CardDescription>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-medium">Products</CardTitle>
                                <Package className="h-5 w-5 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-semibold">{stats.products ?? 0}</div>
                                <CardDescription>Total products</CardDescription>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-medium">Orders</CardTitle>
                                <ShoppingCart className="h-5 w-5 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-semibold">{stats.orders ?? 0}</div>
                                <CardDescription>Total orders</CardDescription>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-medium">Payments</CardTitle>
                                <CreditCard className="h-5 w-5 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-semibold">{stats.payments ?? 0}</div>
                                <CardDescription>Total payments</CardDescription>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-medium">Shipments</CardTitle>
                                <Truck className="h-5 w-5 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-semibold">{stats.shipments ?? 0}</div>
                                <CardDescription>Total shipments</CardDescription>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {isVendor && (
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-medium">My Products</CardTitle>
                                <Package className="h-5 w-5 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-semibold">{stats.my_products ?? 0}</div>
                                <CardDescription>Products in my store(s)</CardDescription>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-medium">My Orders</CardTitle>
                                <ShoppingCart className="h-5 w-5 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-semibold">{stats.my_orders ?? 0}</div>
                                <CardDescription>Orders including my items</CardDescription>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-medium">My Payments</CardTitle>
                                <CreditCard className="h-5 w-5 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-semibold">{stats.my_payments ?? 0}</div>
                                <CardDescription>Payments for my orders</CardDescription>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-medium">My Shipments</CardTitle>
                                <Truck className="h-5 w-5 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-semibold">{stats.my_shipments ?? 0}</div>
                                <CardDescription>Shipments from my store(s)</CardDescription>
                            </CardContent>
                        </Card>
                    </div>
                )}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Users</CardTitle>
                        <CardDescription>Newest signups</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-right">Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentUsers.map((u) => (
                                    <TableRow key={u.id}>
                                        <TableCell>{u.name}</TableCell>
                                        <TableCell>{u.email}</TableCell>
                                        <TableCell className="text-right">
                                            {new Date(u.created_at).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {recentUsers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-muted-foreground">
                                            No users yet
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
