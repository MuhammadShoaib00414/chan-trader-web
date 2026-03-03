import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { router, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Role {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    roles: Array<{ name: string }>;
    status: number;
}

interface EditUserDialogProps {
    user: User | null;
    roles: Role[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditUserDialog({
    user,
    roles,
    open,
    onOpenChange,
}: EditUserDialogProps) {
    const [processing, setProcessing] = useState(false);
    const { data, setData, errors, reset } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        roles: [] as string[],
        status: 1,
    });

    useEffect(() => {
        if (user) {
            const nameParts = user.name.split(' ');
            setData({
                first_name: nameParts[0] || '',
                last_name: nameParts.slice(1).join(' ') || '',
                email: user.email,
                password: '',
                password_confirmation: '',
                roles: user.roles.map((r) => r.name),
                status: user.status,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;

        setProcessing(true);

        // Prepare data, excluding empty password fields
        const updateData = {
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            roles: data.roles,
            status: data.status,
            ...(data.password && data.password.trim() !== '' && {
                password: data.password,
                password_confirmation: data.password_confirmation,
            }),
        };

        router.put(`/api/users/${user.id}`, updateData, {
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                reset();
                setProcessing(false);
            },
            onError: () => {
                setProcessing(false);
            },
        });
    };

    const toggleRole = (roleName: string) => {
        const currentRoles = data.roles;
        if (currentRoles.includes(roleName)) {
            setData(
                'roles',
                currentRoles.filter((r) => r !== roleName),
            );
        } else {
            setData('roles', [...currentRoles, roleName]);
        }
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Update user information and role assignments.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit_first_name">First Name</Label>
                            <Input
                                id="edit_first_name"
                                value={data.first_name}
                                onChange={(e) =>
                                    setData('first_name', e.target.value)
                                }
                                placeholder="John"
                                required
                            />
                            {errors.first_name && (
                                <p className="text-sm text-red-500">
                                    {errors.first_name}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="edit_last_name">Last Name</Label>
                            <Input
                                id="edit_last_name"
                                value={data.last_name}
                                onChange={(e) =>
                                    setData('last_name', e.target.value)
                                }
                                placeholder="Doe"
                                required
                            />
                            {errors.last_name && (
                                <p className="text-sm text-red-500">
                                    {errors.last_name}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="edit_email">Email</Label>
                            <Input
                                id="edit_email"
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                placeholder="john@example.com"
                                required
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="edit_password">
                                Password (leave blank to keep current)
                            </Label>
                            <Input
                                id="edit_password"
                                type="password"
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                                placeholder="••••••••"
                            />
                            {errors.password && (
                                <p className="text-sm text-red-500">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="edit_password_confirmation">
                                Confirm Password
                            </Label>
                            <Input
                                id="edit_password_confirmation"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) =>
                                    setData(
                                        'password_confirmation',
                                        e.target.value,
                                    )
                                }
                                placeholder="••••••••"
                            />
                            {errors.password_confirmation && (
                                <p className="text-sm text-red-500">
                                    {errors.password_confirmation}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label>Assign Roles</Label>
                            <div className="space-y-2 rounded-lg border p-3">
                                {roles.map((role) => (
                                    <div
                                        key={role.id}
                                        className="flex items-center space-x-2"
                                    >
                                        <Checkbox
                                            id={`edit-role-${role.id}`}
                                            checked={data.roles.includes(
                                                role.name,
                                            )}
                                            onCheckedChange={() =>
                                                toggleRole(role.name)
                                            }
                                        />
                                        <Label
                                            htmlFor={`edit-role-${role.id}`}
                                            className="cursor-pointer font-normal"
                                        >
                                            {role.name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            {errors.roles && (
                                <p className="text-sm text-red-500">
                                    {errors.roles}
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            )}
                            Update User
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
