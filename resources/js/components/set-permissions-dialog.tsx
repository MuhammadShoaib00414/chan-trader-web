import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { router } from '@inertiajs/react';
import { LoaderCircle, Settings } from 'lucide-react';
import { useState } from 'react';
import { ToastStack } from '@/components/ui/toast-stack';
import { requestJson } from '@/lib/http';

const permissionAliasMap: Record<string, Partial<Record<'read' | 'create' | 'update' | 'delete' | 'approve' | 'suspend', string[]>>> = {
    stores: {
        read: ['stores.view'],
        create: ['stores.manage_staff'],
        update: ['stores.manage_staff'],
        delete: ['stores.manage_staff'],
        approve: ['stores.approve'],
        suspend: ['stores.suspend'],
    },
    categories: {
        read: ['categories.manage'],
        create: ['categories.manage'],
        update: ['categories.manage'],
        delete: ['categories.manage'],
    },
    subcategories: {
        read: ['subcategories.manage'],
        create: ['subcategories.manage'],
        update: ['subcategories.manage'],
        delete: ['subcategories.manage'],
    },
    brands: {
        read: ['brands.manage'],
        create: ['brands.manage'],
        update: ['brands.manage'],
        delete: ['brands.manage'],
    },
    products: {
        read: ['products.view'],
        create: ['products.create'],
        update: ['products.update', 'products.publish'],
        delete: ['products.delete'],
    },
    orders: {
        read: ['orders.view'],
        create: ['orders.view'],
        update: ['orders.update'],
        delete: ['orders.refund'],
    },
    payments: {
        read: ['payments.view'],
        create: ['payments.capture'],
        update: ['payments.capture'],
        delete: ['payments.capture'],
    },
    shipments: {
        read: ['shipments.view'],
        create: ['shipments.update'],
        update: ['shipments.update'],
        delete: ['shipments.update'],
    },
    promotions: {
        read: ['promotions.view', 'promotions.manage'],
        create: ['promotions.manage'],
        update: ['promotions.manage'],
        delete: ['promotions.manage'],
    },
};

function permissionCandidates(module: string, type: 'read' | 'create' | 'update' | 'delete' | 'approve' | 'suspend'): string[] {
    const actionMap = {
        read: 'view',
        create: 'create',
        update: 'edit',
        delete: 'delete',
        approve: 'approve',
        suspend: 'suspend',
    } as const;

    const dottedActionMap = {
        read: 'view',
        create: 'create',
        update: 'update',
        delete: 'delete',
        approve: 'approve',
        suspend: 'suspend',
    } as const;

    return [
        `${actionMap[type]} ${module}`,
        `${module}.${dottedActionMap[type]}`,
        ...(permissionAliasMap[module]?.[type] ?? []),
    ];
}

function hasPermission(
    assignedPermissions: Array<{ name: string }>,
    module: string,
    type: 'read' | 'create' | 'update' | 'delete' | 'approve' | 'suspend',
): boolean {
    const candidates = new Set(permissionCandidates(module, type));
    return assignedPermissions.some((permission) => candidates.has(permission.name));
}

interface Permission {
    id: number;
    name: string;
}

interface Role {
    id: number;
    name: string;
    permissions: Array<{ name: string }>;
}

interface SetPermissionsDialogProps {
    role: Role;
    allPermissions: Permission[];
    onSaved?: (message: string) => void;
}

interface ModulePermissions {
    [key: string]: {
        read: boolean;
        create: boolean;
        update: boolean;
        delete: boolean;
        approve?: boolean;
        suspend?: boolean;
    };
}

export function SetPermissionsDialog({
    role,
    allPermissions,
    onSaved,
}: SetPermissionsDialogProps) {
    const [open, setOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [toasts, setToasts] = useState<Array<{ id: number; title: string; variant: 'success' | 'error' }>>([]);
    const [query, setQuery] = useState('');
    const dismissToast = (id: number) => setToasts((ts) => ts.filter((t) => t.id !== id));
    const showToast = (title: string, variant: 'success' | 'error' = 'success') => {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        setToasts((ts) => [...ts, { id, title, variant }]);
        setTimeout(() => dismissToast(id), 2500);
    };
    const errorMessageFromResponse = async (res: Response): Promise<string> => {
        try {
            const data = (await res.json()) as { message?: string };
            return data.message || 'Failed to update permissions.';
        } catch {
            return 'Failed to update permissions.';
        }
    };

    // Group all available permissions by module
    const modules = allPermissions.reduce(
        (acc, permission) => {
            let action = '';
            let module = '';
            if (permission.name.includes(' ')) {
                const parts = permission.name.split(' ');
                action = parts[0];
                module = parts.slice(1).join(' ');
            } else if (permission.name.includes('.')) {
                // Map dotted names to module/action pairs (stores.approve, stores.suspend)
                const [mod, act] = permission.name.split('.');
                module = mod;
                action = act;
            }

            if (!module) return acc;

            if (!acc[module]) {
                acc[module] = {
                    read: false,
                    create: false,
                    update: false,
                    delete: false,
                    approve: false,
                    suspend: false,
                };
            }

            if (action === 'view') acc[module].read = true;
            if (action === 'create') acc[module].create = true;
            if (action === 'edit' || action === 'update') acc[module].update = true;
            if (action === 'delete') acc[module].delete = true;
            if (action === 'approve') acc[module].approve = true;
            if (action === 'suspend') acc[module].suspend = true;

            return acc;
        },
        {} as Record<
            string,
            {
                read: boolean;
                create: boolean;
                update: boolean;
                delete: boolean;
                approve?: boolean;
                suspend?: boolean;
            }
        >,
    );

    const moduleKeys = Object.keys(modules);
    const filteredModuleKeys = moduleKeys.filter((m) => m.toLowerCase().includes(query.toLowerCase()));

    const actionTotals = () => {
        let read = 0, create = 0, update = 0, del = 0, approve = 0, suspend = 0;
        filteredModuleKeys.forEach((m) => {
            const perms = modulePermissions[m];
            if (perms?.read) read++;
            if (perms?.create) create++;
            if (perms?.update) update++;
            if (perms?.delete) del++;
            if (perms?.approve) approve++;
            if (perms?.suspend) suspend++;
        });
        return { read, create, update, del, approve, suspend };
    };

    // Initialize with current role permissions
    const getInitialPermissions = (): ModulePermissions => {
        const initial: ModulePermissions = {};

        Object.keys(modules).forEach((module) => {
            initial[module] = {
                read: hasPermission(role.permissions, module, 'read'),
                create: hasPermission(role.permissions, module, 'create'),
                update: hasPermission(role.permissions, module, 'update'),
                delete: hasPermission(role.permissions, module, 'delete'),
                approve:
                    modules[module].approve &&
                    hasPermission(role.permissions, module, 'approve'),
                suspend:
                    modules[module].suspend &&
                    hasPermission(role.permissions, module, 'suspend'),
            };
        });

        return initial;
    };

    const [modulePermissions, setModulePermissions] =
        useState<ModulePermissions>(getInitialPermissions());

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        // Convert module permissions to permission names
        const selectedPermissions: string[] = [];
        Object.entries(modulePermissions).forEach(([module, perms]) => {
            if (perms.read) selectedPermissions.push(`view ${module}`);
            if (perms.create) selectedPermissions.push(`create ${module}`);
            if (perms.update) selectedPermissions.push(`edit ${module}`);
            if (perms.delete) selectedPermissions.push(`delete ${module}`);
            if (perms.approve) selectedPermissions.push(`approve ${module}`);
            if (perms.suspend) selectedPermissions.push(`suspend ${module}`);
        });

        requestJson('PUT', `/api/roles/${role.id}`, {
            name: role.name,
            permissions: selectedPermissions,
        })
            .then(async (res) => {
                setProcessing(false);
                if (res.ok) {
                    if (onSaved) {
                        onSaved('Permissions updated.');
                    } else {
                        showToast('Permissions updated.', 'success');
                    }
                    setOpen(false);
                    router.reload({ only: ['roles'] });
                } else {
                    showToast(await errorMessageFromResponse(res), 'error');
                }
            })
            .catch(() => {
                setProcessing(false);
                showToast('Failed to update permissions.', 'error');
            });
    };

    const togglePermission = (
        module: string,
        type: 'read' | 'create' | 'update' | 'delete' | 'approve' | 'suspend',
    ) => {
        setModulePermissions((prev) => ({
            ...prev,
            [module]: {
                ...prev[module],
                [type]: !prev[module][type],
            },
        }));
    };

    const toggleAll = (module: string) => {
        const allChecked = Object.values(modulePermissions[module]).every(
            (v) => v,
        );
        setModulePermissions((prev) => {
            const curr = prev[module];
            const next: ModulePermissions[string] = {
                read: !allChecked,
                create: !allChecked,
                update: !allChecked,
                delete: !allChecked,
                approve: curr.approve !== undefined ? !allChecked : undefined,
                suspend: curr.suspend !== undefined ? !allChecked : undefined,
            };
            return { ...prev, [module]: next };
        });
    };

    const grantAll = () => {
        setModulePermissions((prev) => {
            const next = { ...prev };
            Object.keys(next).forEach((m) => {
                const curr = next[m];
                next[m] = {
                    read: true,
                    create: true,
                    update: true,
                    delete: true,
                    approve: curr.approve !== undefined ? true : undefined,
                    suspend: curr.suspend !== undefined ? true : undefined,
                };
            });
            return next;
        });
    };

    const clearAll = () => {
        setModulePermissions((prev) => {
            const next = { ...prev };
            Object.keys(next).forEach((m) => {
                const curr = next[m];
                next[m] = {
                    read: false,
                    create: false,
                    update: false,
                    delete: false,
                    approve: curr.approve !== undefined ? false : undefined,
                    suspend: curr.suspend !== undefined ? false : undefined,
                };
            });
            return next;
        });
    };

    const isAllChecked = (module: string) => {
        return Object.values(modulePermissions[module]).every((v) => v);
    };

    const totals = actionTotals();
    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (isOpen) {
                    // Reset to current permissions when opening
                    setModulePermissions(getInitialPermissions());
                }
            }}
        >
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Set Permissions
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[1400px] max-h-[90vh] overflow-y-auto rounded-xl border shadow-lg">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-lg">Set Permissions - {role.name}</DialogTitle>
                        <DialogDescription>
                            Configure access permissions for this role
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label className="text-sm">Module Permissions</Label>
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Filter modules..."
                                        className="w-[260px] rounded-md border px-3 py-1.5 text-sm"
                                    />
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setQuery('')} disabled={processing}>
                                        Clear
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={grantAll} disabled={processing}>
                                        Grant All
                                    </Button>
                                    <Button type="button" variant="ghost" size="sm" onClick={clearAll} disabled={processing}>
                                        Clear All
                                    </Button>
                                </div>
                            </div>
                            <div className="rounded-xl border bg-card p-2">
                                <div className="mb-2 grid grid-cols-7 gap-2 text-xs">
                                    <div className="text-muted-foreground">Enabled totals:</div>
                                    <div className="text-center">Read: {totals.read}</div>
                                    <div className="text-center">Create: {totals.create}</div>
                                    <div className="text-center">Update: {totals.update}</div>
                                    <div className="text-center">Delete: {totals.del}</div>
                                    <div className="text-center">Approve: {totals.approve}</div>
                                    <div className="text-center">Suspend: {totals.suspend}</div>
                                </div>
                            <div className="rounded-xl border bg-card">
                                <Table>
                                    <TableHeader className="sticky top-0 z-10 bg-muted/40">
                                        <TableRow>
                                            <TableHead className="w-[60px] text-xs uppercase tracking-wide">
                                                #
                                            </TableHead>
                                            <TableHead className="text-xs uppercase tracking-wide">
                                                Module Name
                                            </TableHead>
                                            <TableHead className="text-center text-xs uppercase tracking-wide">
                                                READ
                                            </TableHead>
                                            <TableHead className="text-center text-xs uppercase tracking-wide">
                                                CREATE
                                            </TableHead>
                                            <TableHead className="text-center text-xs uppercase tracking-wide">
                                                UPDATE
                                            </TableHead>
                                            <TableHead className="text-center text-xs uppercase tracking-wide">
                                                DELETE
                                            </TableHead>
                                            <TableHead className="text-center text-xs uppercase tracking-wide">
                                                APPROVE
                                            </TableHead>
                                            <TableHead className="text-center text-xs uppercase tracking-wide">
                                                SUSPEND
                                            </TableHead>
                                            <TableHead className="text-center text-xs uppercase tracking-wide">
                                                ALL
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredModuleKeys.map(
                                            (module, index) => (
                                                <TableRow key={module} className="hover:bg-muted/20">
                                                    <TableCell className="font-medium">
                                                        {index + 1}
                                                    </TableCell>
                                                    <TableCell className="capitalize">
                                                        {module}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {modules[module]
                                                            .read && (
                                                            <Switch
                                                                checked={
                                                                    modulePermissions[
                                                                        module
                                                                    ].read
                                                                }
                                                                onCheckedChange={() =>
                                                                    togglePermission(
                                                                        module,
                                                                        'read',
                                                                    )
                                                                }
                                                                disabled={processing}
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {modules[module]
                                                            .create && (
                                                            <Switch
                                                                checked={
                                                                    modulePermissions[
                                                                        module
                                                                    ].create
                                                                }
                                                                onCheckedChange={() =>
                                                                    togglePermission(
                                                                        module,
                                                                        'create',
                                                                    )
                                                                }
                                                                disabled={processing}
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {modules[module]
                                                            .update && (
                                                            <Switch
                                                                checked={
                                                                    modulePermissions[
                                                                        module
                                                                    ].update
                                                                }
                                                                onCheckedChange={() =>
                                                                    togglePermission(
                                                                        module,
                                                                        'update',
                                                                    )
                                                                }
                                                                disabled={processing}
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {modules[module]
                                                            .delete && (
                                                            <Switch
                                                                checked={
                                                                    modulePermissions[
                                                                        module
                                                                    ].delete
                                                                }
                                                                onCheckedChange={() =>
                                                                    togglePermission(
                                                                        module,
                                                                        'delete',
                                                                    )
                                                                }
                                                                disabled={processing}
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {modules[module]
                                                            .approve && (
                                                            <Switch
                                                                checked={
                                                                    modulePermissions[
                                                                        module
                                                                    ].approve
                                                                }
                                                                onCheckedChange={() =>
                                                                    togglePermission(
                                                                        module,
                                                                        'approve',
                                                                    )
                                                                }
                                                                disabled={processing}
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {modules[module]
                                                            .suspend && (
                                                            <Switch
                                                                checked={
                                                                    modulePermissions[
                                                                        module
                                                                    ].suspend
                                                                }
                                                                onCheckedChange={() =>
                                                                    togglePermission(
                                                                        module,
                                                                        'suspend',
                                                                    )
                                                                }
                                                                disabled={processing}
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Switch
                                                            checked={isAllChecked(
                                                                module,
                                                            )}
                                                            onCheckedChange={() =>
                                                                toggleAll(module)
                                                            }
                                                            disabled={processing}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ),
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            )}
                            Save Permissions
                        </Button>
                    </DialogFooter>
                    <ToastStack toasts={toasts} onDismiss={dismissToast} />
                </form>
            </DialogContent>
        </Dialog>
    );
}
