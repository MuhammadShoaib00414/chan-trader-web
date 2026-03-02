import { CreateRoleDialog } from '@/components/create-role-dialog';
import { RolesTable } from '@/components/roles-table';
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
import { Shield } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Roles',
        href: '/roles',
    },
];

interface Role {
    id: number;
    name: string;
    permissions: Array<{ name: string }>;
    created_at: string;
}

interface Permission {
    id: number;
    name: string;
}

interface RolesIndexProps {
    roles: Role[];
    permissions: Permission[];
}

export default function RolesIndex({
    roles = [],
    permissions = [],
}: RolesIndexProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Role Management
                                </CardTitle>
                                <CardDescription>
                                    Manage roles and their permissions
                                </CardDescription>
                            </div>
                            <CreateRoleDialog />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <RolesTable
                            roles={roles}
                            allPermissions={permissions}
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
