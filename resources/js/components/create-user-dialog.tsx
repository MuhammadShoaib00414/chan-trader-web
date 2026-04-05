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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requestJson } from '@/lib/http';
import { router } from '@inertiajs/react';
import { LoaderCircle, Plus } from 'lucide-react';
import { useState } from 'react';

interface Role {
    id: number;
    name: string;
}

interface CreateUserDialogProps {
    roles: Role[];
    onToast?: (message: string, variant?: 'success' | 'error') => void;
}

export function CreateUserDialog({ roles, onToast }: CreateUserDialogProps) {
    const [open, setOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [data, setData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone_number: '',
        city_district: '',
        address: '',
        roles: ['vendor'] as string[],
        status: 1,
    });

    const reset = () => {
        setErrors({});
        setData({
            first_name: '',
            last_name: '',
            email: '',
            password: '',
            password_confirmation: '',
            phone_number: '',
            city_district: '',
            address: '',
            roles: ['vendor'],
            status: 1,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const payload = {
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            password: data.password,
            password_confirmation: data.password_confirmation,
            phone_number: data.phone_number || null,
            city_district: data.city_district || null,
            address: data.address || null,
            roles: data.roles,
            status: data.status === 1,
            role: data.roles[0] ?? undefined,
        };

        const res = await requestJson('POST', '/api/users', payload);
        setProcessing(false);

        if (res.ok) {
            setOpen(false);
            reset();
            onToast?.('User created successfully.', 'success');
            router.reload({ only: ['users'] });
            return;
        }

        const body = await res.json().catch(() => ({}));
        const next: Record<string, string> = {};
        if (body.errors && typeof body.errors === 'object') {
            for (const [k, v] of Object.entries(body.errors as Record<string, string[]>)) {
                if (Array.isArray(v) && v[0]) {
                    next[k] = v[0];
                }
            }
        }
        setErrors(next);
    };

    const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        setData((d) => ({ ...d, roles: value ? [value] : [] }));
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4" />
                    Add User
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>
                            Add a new user to the system. They will receive
                            login credentials.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="first_name">First Name</Label>
                            <Input
                                id="first_name"
                                value={data.first_name}
                                onChange={(e) =>
                                    setData((d) => ({ ...d, first_name: e.target.value }))
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
                            <Label htmlFor="last_name">Last Name</Label>
                            <Input
                                id="last_name"
                                value={data.last_name}
                                onChange={(e) =>
                                    setData((d) => ({ ...d, last_name: e.target.value }))
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
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData((d) => ({ ...d, email: e.target.value }))
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
                            <Label htmlFor="phone_number">Mobile Number</Label>
                            <Input
                                id="phone_number"
                                value={data.phone_number}
                                onChange={(e) =>
                                    setData((d) => ({ ...d, phone_number: e.target.value }))
                                }
                                placeholder="+1 555 123 4567"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="city_district">Location / City</Label>
                            <Input
                                id="city_district"
                                value={data.city_district}
                                onChange={(e) =>
                                    setData((d) => ({ ...d, city_district: e.target.value }))
                                }
                                placeholder="City or District"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(e) =>
                                    setData((d) => ({ ...d, password: e.target.value }))
                                }
                                placeholder="••••••••"
                                required
                            />
                            {errors.password && (
                                <p className="text-sm text-red-500">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">
                                Confirm Password
                            </Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) =>
                                    setData((d) => ({
                                        ...d,
                                        password_confirmation: e.target.value,
                                    }))
                                }
                                placeholder="••••••••"
                                required
                            />
                            {errors.password_confirmation && (
                                <p className="text-sm text-red-500">
                                    {errors.password_confirmation}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                value={data.address}
                                onChange={(e) =>
                                    setData((d) => ({ ...d, address: e.target.value }))
                                }
                                placeholder="Street, building, etc."
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <select
                                id="status"
                                className="w-full rounded-md border px-2 py-2"
                                value={String(data.status)}
                                onChange={(e) =>
                                    setData((d) => ({
                                        ...d,
                                        status: Number(e.target.value),
                                    }))
                                }
                            >
                                <option value="1">Active</option>
                                <option value="0">Inactive</option>
                            </select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="create_role">Assign Role</Label>
                            <select
                                id="create_role"
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
                            onClick={() => setOpen(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            )}
                            Create User
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
