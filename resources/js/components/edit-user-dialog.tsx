import { Button } from '@/components/ui/button';
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
import { requestJson } from '@/lib/http';
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
    phone_number?: string | null;
    city_district?: string | null;
    address?: string | null;
}

interface EditUserDialogProps {
    user: User | null;
    roles: Role[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onToast?: (message: string, variant?: 'success' | 'error') => void;
}

export function EditUserDialog({
    user,
    roles,
    open,
    onOpenChange,
    onToast,
}: EditUserDialogProps) {
    const [processing, setProcessing] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const { data, setData, errors, reset } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        roles: [] as string[],
        status: 1,
        phone_number: '',
        city_district: '',
        address: '',
    });

    useEffect(() => {
        setFormError(null);
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
                phone_number: user.phone_number ?? '',
                city_district: user.city_district ?? '',
                address: user.address ?? '',
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;

        setProcessing(true);
        setFormError(null);

        // Prepare data, excluding empty password fields (JSON API — not Inertia visit)
        const updateData: Record<string, unknown> = {
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            roles: data.roles,
            status: data.status === 1,
            phone_number: (data as any).phone_number || null,
            city_district: (data as any).city_district || null,
            address: (data as any).address || null,
        };
        if (data.password && data.password.trim() !== '') {
            updateData.password = data.password;
            updateData.password_confirmation = data.password_confirmation;
        }

        const res = await requestJson('PUT', `/api/users/${user.id}`, updateData);
        setProcessing(false);

        if (res.ok) {
            onOpenChange(false);
            reset();
            onToast?.('User updated successfully.', 'success');
            router.reload({ only: ['users'] });
            return;
        }

        let message = 'Could not update user.';
        try {
            const body = await res.json();
            if (body?.message) {
                message = body.message;
            }
            if (body?.errors && typeof body.errors === 'object') {
                const first = Object.values(body.errors as Record<string, string[]>)[0];
                if (Array.isArray(first) && first[0]) {
                    message = first[0];
                }
            }
        } catch {
            /* ignore */
        }
        setFormError(message);
    };

    const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        setData('roles', value ? [value] : []);
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

                    {formError && (
                        <p className="text-sm text-red-600" role="alert">
                            {formError}
                        </p>
                    )}

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
                            <Label htmlFor="edit_phone_number">Mobile Number</Label>
                            <Input
                                id="edit_phone_number"
                                value={(data as any).phone_number ?? ''}
                                onChange={(e) =>
                                    setData('phone_number' as any, e.target.value)
                                }
                                placeholder="+1 555 123 4567"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="edit_city_district">Location / City</Label>
                            <Input
                                id="edit_city_district"
                                value={(data as any).city_district ?? ''}
                                onChange={(e) =>
                                    setData('city_district' as any, e.target.value)
                                }
                                placeholder="City or District"
                            />
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
                            <Label htmlFor="edit_address">Address</Label>
                            <Input
                                id="edit_address"
                                value={(data as any).address ?? ''}
                                onChange={(e) =>
                                    setData('address' as any, e.target.value)
                                }
                                placeholder="Street, building, etc."
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="edit_status">Status</Label>
                            <select
                                id="edit_status"
                                className="w-full rounded-md border px-2 py-2"
                                value={String(data.status)}
                                onChange={(e) =>
                                    setData('status', Number(e.target.value))
                                }
                            >
                                <option value={1}>Active</option>
                                <option value={0}>Inactive</option>
                            </select>
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
                            <Label htmlFor="edit_role">Assign Role</Label>
                            <select
                                id="edit_role"
                                className="w-full rounded-md border px-2 py-2"
                                value={data.roles[0] ?? ''}
                                onChange={handleRoleChange}
                            >
                                <option value="">Select role</option>
                                {roles.map((role) => (
                                    <option key={role.id} value={role.name}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
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
