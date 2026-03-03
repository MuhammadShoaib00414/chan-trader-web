import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Role {
    id: number;
    name: string;
    permissions: string[];
}

interface Props {
    roles: Role[];
    permissions: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Roles', href: '/roles' },
];

// Group permissions by prefix for cleaner display
function groupPermissions(permissions: string[]) {
    const groups: Record<string, string[]> = {};
    for (const perm of permissions) {
        const parts = perm.split('-');
        const group = parts.length > 1 ? parts.slice(1).join('-') : perm;
        if (!groups[group]) groups[group] = [];
        groups[group].push(perm);
    }
    return groups;
}

export default function RolesIndex({ roles, permissions }: Props) {
    const grouped = groupPermissions(permissions);

    // ── Create modal ──────────────────────────────────────────────
    const [createOpen, setCreateOpen] = useState(false);
    const createForm = useForm({ name: '', permissions: [] as string[] });

    function openCreate() {
        createForm.reset();
        setCreateOpen(true);
    }

    function submitCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post('/roles', {
            onSuccess: () => setCreateOpen(false),
        });
    }

    // ── Edit modal ────────────────────────────────────────────────
    const [editOpen, setEditOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const editForm = useForm({ name: '', permissions: [] as string[] });

    function openEdit(role: Role) {
        setEditingRole(role);
        editForm.setData({ name: role.name, permissions: role.permissions as string[] });
        setEditOpen(true);
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editingRole) return;
        editForm.put(`/roles/${editingRole.id}`, {
            onSuccess: () => setEditOpen(false),
        });
    }

    // ── Delete modal ──────────────────────────────────────────────
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingRole, setDeletingRole] = useState<Role | null>(null);
    const deleteForm = useForm({});

    function openDelete(role: Role) {
        setDeletingRole(role);
        setDeleteOpen(true);
    }

    function submitDelete() {
        if (!deletingRole) return;
        deleteForm.delete(`/roles/${deletingRole.id}`, {
            onSuccess: () => setDeleteOpen(false),
        });
    }

    // ── Permission checkbox helpers ───────────────────────────────
    function togglePermission(
        form: typeof createForm | typeof editForm,
        perm: string,
    ) {
        const current = form.data.permissions;
        form.setData(
            'permissions',
            current.includes(perm)
                ? current.filter((p) => p !== perm)
                : [...current, perm],
        );
    }

    function PermissionGrid({ form }: { form: typeof createForm }) {
        return (
            <div className="max-h-72 overflow-y-auto rounded-md border p-3 space-y-4">
                {Object.entries(grouped).map(([group, perms]) => (
                    <div key={group}>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {group.replace(/-/g, ' ')}
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                            {perms.map((perm) => (
                                <label
                                    key={perm}
                                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-muted"
                                >
                                    <Checkbox
                                        checked={form.data.permissions.includes(perm)}
                                        onCheckedChange={() => togglePermission(form, perm)}
                                    />
                                    {perm}
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Roles</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage roles and their permissions.
                        </p>
                    </div>
                    <Button onClick={openCreate} size="sm">
                        <Plus className="mr-1.5 size-4" />
                        New Role
                    </Button>
                </div>

                {/* Table */}
                <div className="rounded-xl border bg-card">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left text-muted-foreground">
                                <th className="px-4 py-3 font-medium">Role</th>
                                <th className="px-4 py-3 font-medium">Permissions</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                                        No roles found. Create one to get started.
                                    </td>
                                </tr>
                            )}
                            {roles.map((role) => (
                                <tr key={role.id} className="border-b last:border-0 hover:bg-muted/30">
                                    <td className="px-4 py-3 font-medium">{role.name}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {role.permissions.slice(0, 5).map((perm) => (
                                                <Badge key={perm} variant="secondary" className="text-xs">
                                                    {perm}
                                                </Badge>
                                            ))}
                                            {role.permissions.length > 5 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{role.permissions.length - 5} more
                                                </Badge>
                                            )}
                                            {role.permissions.length === 0 && (
                                                <span className="text-muted-foreground text-xs">No permissions</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEdit(role)}
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => openDelete(role)}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Create Modal ── */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Create Role</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitCreate} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="create-name">Role Name</Label>
                            <Input
                                id="create-name"
                                value={createForm.data.name}
                                onChange={(e) => createForm.setData('name', e.target.value)}
                                placeholder="e.g. Editor"
                                autoFocus
                            />
                            <InputError message={createForm.errors.name} />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Permissions</Label>
                            <PermissionGrid form={createForm} />
                            <InputError message={createForm.errors.permissions} />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCreateOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createForm.processing}>
                                Create
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Edit Modal ── */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Role</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-name">Role Name</Label>
                            <Input
                                id="edit-name"
                                value={editForm.data.name}
                                onChange={(e) => editForm.setData('name', e.target.value)}
                            />
                            <InputError message={editForm.errors.name} />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Permissions</Label>
                            <PermissionGrid form={editForm} />
                            <InputError message={editForm.errors.permissions} />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={editForm.processing}>
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Delete Modal ── */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete Role</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to delete{' '}
                        <span className="font-semibold text-foreground">
                            {deletingRole?.name}
                        </span>
                        ? This action cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={submitDelete}
                            disabled={deleteForm.processing}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
