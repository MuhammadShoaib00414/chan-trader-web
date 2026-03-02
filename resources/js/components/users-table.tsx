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
import { router } from '@inertiajs/react';
import { Edit, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { EditUserDialog } from './edit-user-dialog';

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

interface UsersTableProps {
    users: User[];
    roles: Role[];
}

export function UsersTable({ users, roles }: UsersTableProps) {
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setEditDialogOpen(true);
    };

    const handleDelete = (userId: number) => {
        if (confirm('Are you sure you want to delete this user?')) {
            router.delete(`/api/users/${userId}`, {
                preserveScroll: true,
            });
        }
    };

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
            />
            <div className="rounded-lg border">
                <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">
                                {user.name}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
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
                            <TableCell>
                                <Badge
                                    variant={
                                        user.status === 1
                                            ? 'default'
                                            : 'destructive'
                                    }
                                >
                                    {user.status === 1 ? 'Active' : 'Inactive'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
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
        </>
    );
}
