import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Users, Shield, KeyRound } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface DashboardProps {
    stats: {
        users: number;
        roles: number;
        permissions: number;
    };
    recentUsers: Array<{
        id: number;
        name: string;
        email: string;
        created_at: string;
    }>;
}

export default function Dashboard({ stats, recentUsers }: DashboardProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-5 w-5 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-semibold">{stats.users}</div>
                            <CardDescription>Active user accounts</CardDescription>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-medium">Roles</CardTitle>
                            <Shield className="h-5 w-5 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-semibold">{stats.roles}</div>
                            <CardDescription>Defined roles</CardDescription>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-medium">Permissions</CardTitle>
                            <KeyRound className="h-5 w-5 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-semibold">{stats.permissions}</div>
                            <CardDescription>Available permissions</CardDescription>
                        </CardContent>
                    </Card>
                </div>
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
