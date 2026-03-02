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
}

interface ModulePermissions {
    [key: string]: {
        read: boolean;
        create: boolean;
        update: boolean;
        delete: boolean;
    };
}

export function SetPermissionsDialog({
    role,
    allPermissions,
}: SetPermissionsDialogProps) {
    const [open, setOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Group all available permissions by module
    const modules = allPermissions.reduce(
        (acc, permission) => {
            const parts = permission.name.split(' ');
            const action = parts[0];
            const module = parts.slice(1).join(' ');

            if (!acc[module]) {
                acc[module] = {
                    read: false,
                    create: false,
                    update: false,
                    delete: false,
                };
            }

            if (action === 'view') acc[module].read = true;
            if (action === 'create') acc[module].create = true;
            if (action === 'edit') acc[module].update = true;
            if (action === 'delete') acc[module].delete = true;

            return acc;
        },
        {} as Record<
            string,
            {
                read: boolean;
                create: boolean;
                update: boolean;
                delete: boolean;
            }
        >,
    );

    // Initialize with current role permissions
    const getInitialPermissions = (): ModulePermissions => {
        const initial: ModulePermissions = {};

        Object.keys(modules).forEach((module) => {
            initial[module] = {
                read: role.permissions.some((p) => p.name === `view ${module}`),
                create: role.permissions.some(
                    (p) => p.name === `create ${module}`,
                ),
                update: role.permissions.some(
                    (p) => p.name === `edit ${module}`,
                ),
                delete: role.permissions.some(
                    (p) => p.name === `delete ${module}`,
                ),
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
        });

        router.put(
            `/api/roles/${role.id}`,
            {
                name: role.name,
                permissions: selectedPermissions,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setOpen(false);
                    setProcessing(false);
                },
                onError: () => {
                    setProcessing(false);
                },
            },
        );
    };

    const togglePermission = (
        module: string,
        type: 'read' | 'create' | 'update' | 'delete',
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
        setModulePermissions((prev) => ({
            ...prev,
            [module]: {
                read: !allChecked,
                create: !allChecked,
                update: !allChecked,
                delete: !allChecked,
            },
        }));
    };

    const isAllChecked = (module: string) => {
        return Object.values(modulePermissions[module]).every((v) => v);
    };

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
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Set Permissions - {role.name}</DialogTitle>
                        <DialogDescription>
                            Configure access permissions for this role
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Module Permissions</Label>
                            <div className="rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[40px]">
                                                #
                                            </TableHead>
                                            <TableHead>Module Name</TableHead>
                                            <TableHead className="text-center">
                                                READ
                                            </TableHead>
                                            <TableHead className="text-center">
                                                CREATE
                                            </TableHead>
                                            <TableHead className="text-center">
                                                UPDATE
                                            </TableHead>
                                            <TableHead className="text-center">
                                                DELETE
                                            </TableHead>
                                            <TableHead className="text-center">
                                                ALL
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Object.keys(modules).map(
                                            (module, index) => (
                                                <TableRow key={module}>
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
                </form>
            </DialogContent>
        </Dialog>
    );
}
