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
import { requestJson } from '@/lib/http';
import { router } from '@inertiajs/react';
import { Edit, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { EditUserDialog } from './edit-user-dialog';

interface User {
    id: number;
    name: string;
    email: string;
    phone_number?: string | null;
    roles: Array<{ name: string }>;
    status: number;
    created_at: string;
    shop_name?: string | null;
    city_district?: string | null;
    address?: string | null;
}

interface Role {
    id: number;
    name: string;
}

interface UsersTableProps {
    users: User[];
    roles: Role[];
    onToast?: (message: string, variant?: 'success' | 'error') => void;
}

export function UsersTable({ users, roles, onToast }: UsersTableProps) {
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [sortBy, setSortBy] = useState<'name' | 'email' | 'created_at' | 'status'>('name');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setEditDialogOpen(true);
    };

    const handleDelete = async (userId: number) => {
        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }
        const res = await requestJson('DELETE', `/api/users/${userId}`, {});
        if (res.ok) {
            onToast?.('User deleted.', 'success');
            router.reload({ only: ['users'] });
            return;
        }
        const body = await res.json().catch(() => ({}));
        onToast?.(
            (body as { message?: string }).message ?? 'Could not delete user.',
            'error',
        );
    };

    const toggleSort = (key: 'name' | 'email' | 'created_at' | 'status') => {
        if (sortBy === key) {
            setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(key);
            setSortDir('asc');
        }
    };

    const sortedUsers = [...users].sort((a, b) => {
        let av: string | number = '';
        let bv: string | number = '';
        switch (sortBy) {
            case 'name':
                av = a.name.toLowerCase();
                bv = b.name.toLowerCase();
                break;
            case 'email':
                av = a.email.toLowerCase();
                bv = b.email.toLowerCase();
                break;
            case 'created_at':
                av = new Date(a.created_at).getTime();
                bv = new Date(b.created_at).getTime();
                break;
            case 'status':
                av = a.status;
                bv = b.status;
                break;
        }
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    if (users.length === 0) {
        return (
            <div className="rounded-lg border p-8 text-center">
                <p className="text-sm text-muted-foreground">
                    No users found. Click "Add User" to create one.
                </p>
            </div>
        );
    }

    return (
        <>
            <EditUserDialog
                user={editingUser}
                roles={roles}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onToast={onToast}
            />
            <div className="rounded-lg border">
                <div className="hidden md:block w-full overflow-x-auto">
                <Table className="min-w-[720px]">
                <TableHeader>
                    <TableRow>
                        <TableHead>
                            <button
                                type="button"
                                className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide cursor-pointer"
                                onClick={() => toggleSort('name')}
                            >
                                Name
                            </button>
                        </TableHead>
                        <TableHead>
                            <button
                                type="button"
                                className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide cursor-pointer"
                                onClick={() => toggleSort('email')}
                            >
                                Email
                            </button>
                        </TableHead>
                        <TableHead className="hidden md:table-cell">Phone</TableHead>
                        <TableHead className="hidden lg:table-cell">Roles</TableHead>
                        <TableHead className="hidden xl:table-cell">Shop Name</TableHead>
                        <TableHead className="hidden 2xl:table-cell">City</TableHead>
                        <TableHead className="hidden 2xl:table-cell">Addres</TableHead>
                        
                        <TableHead>
                            <button
                                type="button"
                                className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide cursor-pointer"
                                onClick={() => toggleSort('status')}
                            >
                                Status
                            </button>
                        </TableHead>
                        <TableHead className="hidden sm:table-cell">
                            <button
                                type="button"
                                className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide cursor-pointer"
                                onClick={() => toggleSort('created_at')}
                            >
                                Created
                            </button>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedUsers.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium whitespace-nowrap">
                                {user.name}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{user.email}</TableCell>
                            <TableCell className="hidden md:table-cell">{user.phone_number ?? '-'}</TableCell>
                            <TableCell className="hidden lg:table-cell">
                                <div className="flex flex-wrap gap-1">
                                    {user.roles.map((role) => (
                                        <Badge
                                            key={role.name}
                                            variant="secondary"
                                        >
                                            {role.name}
                                        </Badge>
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell className="hidden xl:table-cell">{user.shop_name ?? '-'}</TableCell>
                            <TableCell className="hidden 2xl:table-cell">{user.city_district ?? '-'}</TableCell>
                             <TableCell className="hidden 2xl:table-cell">{user.address ?? '-'}</TableCell>
                            <TableCell>
                                <Badge
                                    variant={
                                        user.status == 1
                                            ? 'default'
                                            : 'destructive'
                                    }
                                >
                                    {user.status == 1 ? 'Active' : 'Inactive'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground hidden sm:table-cell">
                                {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
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
                                        <DropdownMenuItem
                                            onClick={() => handleEdit(user)}
                                        >
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit User
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={() => handleDelete(user.id)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete User
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            </div>
            <div className="md:hidden grid gap-2 p-3">
                {sortedUsers.map((user) => (
                    <div key={user.id} className="rounded-lg border p-3">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{user.phone_number ?? '-'}</div>
                        <div className="mt-2 flex flex-wrap gap-1">
                            {user.roles.map((role) => (
                                <Badge key={role.name} variant="secondary">{role.name}</Badge>
                            ))}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                            {user.shop_name ? `Shop: ${user.shop_name}` : ''}
                            {user.shop_name && user.city_district ? ' | ' : ''}
                            {user.city_district ? `City: ${user.city_district}` : ''}
                            {user.address ? `Address: ${user.address}` : ''}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <Badge variant={user.status == 1 ? 'default' : 'destructive'}>{user.status == 1 ? 'Active' : 'Inactive'}</Badge>
                            <div className="text-xs text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</div>
                        </div>
                        <div className="mt-2 flex justify-end">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">Actions</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEdit(user)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit User
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(user.id)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete User
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        </>
    );
}
