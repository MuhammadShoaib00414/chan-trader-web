import { CreateUserDialog } from '@/components/create-user-dialog';
import { UsersTable } from '@/components/users-table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { ToastStack } from '@/components/ui/toast-stack';
import { Head } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { useMemo, useState } from 'react';
import { Users as UsersIcon } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Users',
        href: '/users',
    },
];

interface User {
    id: number;
    name: string;
    email: string;
    phone_number?: string | null;
    roles: Array<{ name: string }>;
    status: number;
    created_at: string;
}

interface Role {
    id: number;
    name: string;
}

interface UsersIndexProps {
    users: User[];
    roles: Role[];
}

export default function UsersIndex({ users = [], roles = [] }: UsersIndexProps) {
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [toasts, setToasts] = useState<
        Array<{ id: number; title: string; variant: 'success' | 'error' }>
    >([]);
    const dismissToast = (id: number) =>
        setToasts((ts) => ts.filter((t) => t.id !== id));
    const showToast = (
        title: string,
        variant: 'success' | 'error' = 'success',
    ) => {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        setToasts((ts) => [...ts, { id, title, variant }]);
        setTimeout(() => dismissToast(id), 2500);
    };

    const filtered = useMemo(
        () =>
            users.filter((u) => {
                const q = query.trim().toLowerCase();
                const statusText = u.status == 1 ? 'active' : 'inactive';
                const roleNames = u.roles.map((r) => r.name);

                if (statusFilter === 'active' && u.status != 1) {
                    return false;
                }
                if (statusFilter === 'inactive' && u.status == 1) {
                    return false;
                }
                if (roleFilter !== 'all' && !roleNames.includes(roleFilter)) {
                    return false;
                }

                if (!q) return true;

                const roleMatch = roleNames.some((name) =>
                    name.toLowerCase().includes(q),
                );

                return (
                    u.name.toLowerCase().includes(q) ||
                    u.email.toLowerCase().includes(q) ||
                    statusText.includes(q) ||
                    roleMatch
                );
            }),
        [users, query, statusFilter, roleFilter],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2">
                                    <UsersIcon className="h-5 w-5" />
                                    User Management
                                </CardTitle>
                                <CardDescription>
                                    Manage users (non-vendors), assign roles and permissions
                                </CardDescription>
                            </div>
                            <div className="flex flex-col gap-2 md:flex-row md:items-center">
                                <select
                                    className="w-full rounded-md border px-2 py-1 text-sm md:w-32"
                                    value={statusFilter}
                                    onChange={(e) =>
                                        setStatusFilter(
                                            e.target.value as
                                                | 'all'
                                                | 'active'
                                                | 'inactive',
                                        )
                                    }
                                >
                                    <option value="all">All status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                                <select
                                    className="w-full rounded-md border px-2 py-1 text-sm md:w-40"
                                    value={roleFilter}
                                    onChange={(e) =>
                                        setRoleFilter(e.target.value)
                                    }
                                >
                                    <option value="all">All roles</option>
                                    {roles.map((role) => (
                                        <option
                                            key={role.id}
                                            value={role.name}
                                        >
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                                <Input
                                    placeholder="Search by name, email, status, or role..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="md:w-64"
                                />
                                <CreateUserDialog roles={roles} onToast={showToast} />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <UsersTable users={filtered} roles={roles} onToast={showToast} />
                    </CardContent>
                </Card>
            </div>
            <ToastStack toasts={toasts} onDismiss={dismissToast} />
        </AppLayout>
    );
}
