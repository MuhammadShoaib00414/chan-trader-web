import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { SetPermissionsDialog } from '@/components/set-permissions-dialog';
import { router } from '@inertiajs/react';
import { Edit, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ToastStack } from './ui/toast-stack';

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

interface RolesTableProps {
    roles: Role[];
    allPermissions: Permission[];
}

export function RolesTable({ roles, allPermissions }: RolesTableProps) {
    const [toasts, setToasts] = useState<Array<{ id: number; title: string; variant: 'success' | 'error' }>>([]);
    const dismissToast = (id: number) => setToasts((ts) => ts.filter((t) => t.id !== id));
    const showToast = (title: string, variant: 'success' | 'error' = 'success') => {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        setToasts((ts) => [...ts, { id, title, variant }]);
        setTimeout(() => dismissToast(id), 2500);
    };
    const handleDelete = (roleId: number) => {
        if (confirm('Are you sure you want to delete this role?')) {
            router.delete(`/api/roles/${roleId}`, {
                preserveScroll: true,
            });
        }
    };

    if (roles.length === 0) {
        return (
            <div className="rounded-lg border p-8 text-center">
                <p className="text-sm text-muted-foreground">
                    No roles found. Click "Add Role" to create one.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border">
            <div className="hidden md:block w-full overflow-x-auto">
            <Table className="min-w-[640px]">
                <TableHeader>
                    <TableRow>
                        <TableHead className="whitespace-nowrap">Role Name</TableHead>
                        <TableHead className="hidden md:table-cell">Permissions</TableHead>
                        <TableHead className="hidden sm:table-cell">Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {roles.map((role) => (
                        <TableRow key={role.id}>
                            <TableCell className="font-medium whitespace-nowrap">
                                <Badge variant="outline">{role.name}</Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                                <div className="flex flex-wrap gap-1">
                                    {role.permissions.length > 0 ? (
                                        <>
                                            {role.permissions
                                                .slice(0, 3)
                                                .map((permission) => (
                                                    <Badge
                                                        key={permission.name}
                                                        variant="secondary"
                                                        className="text-xs"
                                                    >
                                                        {permission.name}
                                                    </Badge>
                                                ))}
                                            {role.permissions.length > 3 && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    +
                                                    {role.permissions.length - 3}{' '}
                                                    more
                                                </Badge>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">
                                            No permissions
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground hidden sm:table-cell">
                                {new Date(role.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <SetPermissionsDialog
                                        role={role}
                                        allPermissions={allPermissions}
                                        onSaved={(msg) => showToast(msg, 'success')}
                                    />
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className="h-8 w-8 p-0"
                                            >
                                                <span className="sr-only">
                                                    Open menu
                                                </span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>
                                                Actions
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit Role
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onClick={() =>
                                                    handleDelete(role.id)
                                                }
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete Role
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            </div>
            <div className="md:hidden grid gap-2 p-3">
                {roles.map((role) => (
                    <div key={role.id} className="rounded-lg border p-3">
                        <div className="font-medium">{role.name}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                            {new Date(role.created_at).toLocaleDateString()}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                            {role.permissions.slice(0, 4).map((permission) => (
                                <Badge key={permission.name} variant="secondary">{permission.name}</Badge>
                            ))}
                            {role.permissions.length > 4 && (
                                <Badge variant="secondary">+{role.permissions.length - 4}</Badge>
                            )}
                        </div>
                        <div className="mt-2 flex justify-end gap-2">
                            <SetPermissionsDialog role={role} allPermissions={allPermissions} onSaved={(msg) => showToast(msg, 'success')} />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">Actions</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Role
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(role.id)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Role
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ))}
            </div>
            <ToastStack toasts={toasts} onDismiss={dismissToast} />
        </div>
    );
}
