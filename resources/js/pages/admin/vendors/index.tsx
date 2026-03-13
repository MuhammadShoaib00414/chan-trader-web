import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { ToastStack } from '@/components/ui/toast-stack';
import { requestJson } from '@/lib/http';
import { Separator } from '@/components/ui/separator';

type VendorItem = {
  id: number;
  name: string;
  email: string;
  store: { id: number; name: string; slug: string; status: string } | null;
};

interface VendorsPageProps {
  vendors: VendorItem[];
}

export default function VendorsIndex({ vendors }: VendorsPageProps) {
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [storeName, setStoreName] = useState('');

  const [openReset, setOpenReset] = useState(false);
  const [resetVendorId, setResetVendorId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

  const [openAddStore, setOpenAddStore] = useState(false);
  const [addStoreVendorId, setAddStoreVendorId] = useState<number | null>(null);
  const [extraStoreName, setExtraStoreName] = useState('');

  const [toasts, setToasts] = useState<Array<{ id: number; title: string; variant: 'success' | 'error' }>>([]);
  const dismissToast = (id: number) => setToasts((ts) => ts.filter((t) => t.id !== id));
  const showToast = (title: string, variant: 'success' | 'error' = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((ts) => [...ts, { id, title, variant }]);
    setTimeout(() => dismissToast(id), 2500);
  };

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    const res = await requestJson('POST', '/api/admin/vendors', {
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      password_confirmation: passwordConfirmation,
      store_name: storeName,
    });
    setProcessing(false);
    if (res.ok) {
      setOpen(false);
      setFirstName(''); setLastName(''); setEmail(''); setPassword(''); setPasswordConfirmation(''); setStoreName('');
      showToast('Vendor created.', 'success');
      router.reload({ only: ['vendors'] });
    } else {
      showToast('Failed to create vendor.', 'error');
    }
  };

  const approveStore = async (storeId: number) => {
    const res = await requestJson('POST', `/api/admin/stores/${storeId}/approve`, {});
    if (res.ok) {
      showToast('Store approved.', 'success');
      router.reload({ only: ['vendors'] });
    } else {
      showToast('Failed to approve store.', 'error');
    }
  };

  const suspendStore = async (storeId: number) => {
    const res = await requestJson('POST', `/api/admin/stores/${storeId}/suspend`, {});
    if (res.ok) {
      showToast('Store suspended.', 'success');
      router.reload({ only: ['vendors'] });
    } else {
      showToast('Failed to suspend store.', 'error');
    }
  };

  const openResetPassword = (vendorId: number) => {
    setResetVendorId(vendorId);
    setNewPassword('');
    setNewPasswordConfirm('');
    setOpenReset(true);
  };

  const submitResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetVendorId) return;
    const res = await requestJson('PUT', `/api/users/${resetVendorId}`, {
      password: newPassword,
      password_confirmation: newPasswordConfirm,
    });
    if (res.ok) {
      setOpenReset(false);
      showToast('Password reset.', 'success');
    } else {
      showToast('Failed to reset password.', 'error');
    }
  };

  const openAddStoreDialog = (vendorId: number) => {
    setAddStoreVendorId(vendorId);
    setExtraStoreName('');
    setOpenAddStore(true);
  };

  const submitAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addStoreVendorId) return;
    const name = extraStoreName.trim();
    const slug = slugify(name);
    const res = await requestJson('POST', '/api/admin/stores', {
      owner_id: addStoreVendorId,
      name,
      slug,
    });
    if (res.ok) {
      setOpenAddStore(false);
      showToast('Store created.', 'success');
      router.reload({ only: ['vendors'] });
    } else {
      showToast('Failed to create store.', 'error');
    }
  };

  return (
    <AppLayout>
      <Head title="Vendors" />
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Vendor Management</CardTitle>
              <CardDescription>List, create, and manage vendor accounts and stores</CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>Create Vendor</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[640px]">
                <form onSubmit={submit}>
                  <DialogHeader>
                    <DialogTitle>Create Vendor</DialogTitle>
                    <DialogDescription>Provide vendor account details and a store name</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3 py-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                      <Input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                    <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                      <Input placeholder="Confirm password" type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} />
                    </div>
                    <Input placeholder="Store name" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={processing}>Cancel</Button>
                    <Button type="submit" disabled={processing}>Create</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>{v.name}</TableCell>
                    <TableCell>{v.email}</TableCell>
                    <TableCell>{v.store ? v.store.name : '—'}</TableCell>
                    <TableCell>{v.store ? v.store.status : '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {v.store ? (
                          <>
                            {v.store.status !== 'active' && (
                              <Button size="sm" variant="outline" onClick={() => approveStore(v.store!.id)}>
                                Approve
                              </Button>
                            )}
                            {v.store.status === 'active' && (
                              <Button size="sm" variant="destructive" onClick={() => suspendStore(v.store!.id)}>
                                Suspend
                              </Button>
                            )}
                          </>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => openAddStoreDialog(v.id)}>
                            Add Store
                          </Button>
                        )}
                        <Separator orientation="vertical" className="h-6" />
                        <Button size="sm" variant="ghost" onClick={() => openResetPassword(v.id)}>
                          Reset Password
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {vendors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">No vendors</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={openReset} onOpenChange={setOpenReset}>
          <DialogContent className="sm:max-w-[520px]">
            <form onSubmit={submitResetPassword}>
              <DialogHeader>
                <DialogTitle>Reset Vendor Password</DialogTitle>
                <DialogDescription>Set a new password for this vendor</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-3">
                <Input placeholder="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <Input placeholder="Confirm new password" type="password" value={newPasswordConfirm} onChange={(e) => setNewPasswordConfirm(e.target.value)} />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpenReset(false)}>Cancel</Button>
                <Button type="submit">Update Password</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={openAddStore} onOpenChange={setOpenAddStore}>
          <DialogContent className="sm:max-w-[520px]">
            <form onSubmit={submitAddStore}>
              <DialogHeader>
                <DialogTitle>Add Store</DialogTitle>
                <DialogDescription>Create an additional store for this vendor</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-3">
                <Input placeholder="Store name" value={extraStoreName} onChange={(e) => setExtraStoreName(e.target.value)} />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpenAddStore(false)}>Cancel</Button>
                <Button type="submit">Create Store</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </div>
    </AppLayout>
  );
}
