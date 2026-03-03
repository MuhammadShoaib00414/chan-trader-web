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
import { Head } from '@inertiajs/react';
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
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <UsersIcon className="h-5 w-5" />
                                    User Management
                                </CardTitle>
                                <CardDescription>
                                    Manage users, assign roles and permissions
                                </CardDescription>
                            </div>
                            <CreateUserDialog roles={roles} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <UsersTable users={users} roles={roles} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
