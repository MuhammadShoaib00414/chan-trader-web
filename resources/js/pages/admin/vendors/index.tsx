import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useMemo, useState } from 'react';
import { ToastStack } from '@/components/ui/toast-stack';
import { patchForm, postForm, requestJson } from '@/lib/http';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit2, MoreHorizontal, Trash2 } from 'lucide-react';

type VendorItem = {
  id: number;
  name: string;
  email: string;
  phone_number?: string | null;
  status: number;
  shop_name?: string | null;
  city_district?: string | null;
  address?: string | null;
  store: {
    id: number;
    name: string;
    slug: string;
    status: string;
    business_whatsapp_url?: string | null;
    logo?: string | null;
    banner?: string | null;
  } | null;
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
  const [shopName, setShopName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [address, setAddress] = useState('');
  const [businessWhatsappUrl, setBusinessWhatsappUrl] = useState('');
  const [statusValue, setStatusValue] = useState<'1' | '0'>('1');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const [openReset, setOpenReset] = useState(false);
  const [resetVendorId, setResetVendorId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

  const [openAddStore, setOpenAddStore] = useState(false);
  const [addStoreVendorId, setAddStoreVendorId] = useState<number | null>(null);
  const [extraStoreName, setExtraStoreName] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<VendorItem | null>(null);
  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStatus, setEditStatus] = useState<number>(1);
  const [editShopName, setEditShopName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editBusinessWhatsapp, setEditBusinessWhatsapp] = useState('');
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editBannerFile, setEditBannerFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeBanner, setRemoveBanner] = useState(false);

  const [toasts, setToasts] = useState<Array<{ id: number; title: string; variant: 'success' | 'error' }>>([]);
  const dismissToast = (id: number) => setToasts((ts) => ts.filter((t) => t.id !== id));
  const showToast = (title: string, variant: 'success' | 'error' = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((ts) => [...ts, { id, title, variant }]);
    setTimeout(() => dismissToast(id), 2500);
  };

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'vendor'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'status'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (key: 'name' | 'email' | 'status') => {
    if (sortBy === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(
    () =>
      vendors.filter((v) => {
        const q = query.toLowerCase();
        const statusText = v.status == 1 ? 'active' : 'inactive';
        if (statusFilter === 'active' && v.status != 1) {
          return false;
        }
        if (statusFilter === 'inactive' && v.status == 1) {
          return false;
        }
        if (roleFilter === 'vendor') {
          // all records here are vendors already; keep for symmetry
        }

        if (!q) return true;

        return (
          v.name.toLowerCase().includes(q) ||
          v.email.toLowerCase().includes(q) ||
          (v.store?.name?.toLowerCase().includes(q) ?? false) ||
          statusText.includes(q) ||
          'vendor'.includes(q)
        );
      }),
    [vendors, query, statusFilter, roleFilter],
  );

  const sortedVendors = [...filtered].sort((a, b) => {
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
      case 'status':
        av = a.status;
        bv = b.status;
        break;
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

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
    const fd = new FormData();
    fd.append('first_name', firstName);
    fd.append('last_name', lastName);
    fd.append('email', email);
    fd.append('password', password);
    fd.append('password_confirmation', passwordConfirmation);
    fd.append('store_name', storeName);
    fd.append('shop_name', shopName || storeName);
    if (mobileNumber) fd.append('phone_number', mobileNumber);
    if (businessWhatsappUrl.trim()) fd.append('business_whatsapp_url', businessWhatsappUrl.trim());
    if (locationCity) fd.append('city_district', locationCity);
    if (address) fd.append('address', address);
    fd.append('status', statusValue);
    if (logoFile) fd.append('logo', logoFile);
    if (bannerFile) fd.append('banner', bannerFile);
    const res = await postForm('/api/admin/vendors', fd);
    setProcessing(false);
    if (res.ok) {
      setOpen(false);
      setFirstName(''); setLastName(''); setEmail(''); setPassword(''); setPasswordConfirmation('');
      setStoreName(''); setShopName(''); setMobileNumber(''); setLocationCity(''); setAddress('');
      setBusinessWhatsappUrl('');
      setLogoFile(null); setBannerFile(null);
      setStatusValue('1');
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

  const openEditVendor = (v: VendorItem) => {
    setEditVendor(v);
    const parts = v.name.split(' ');
    setEditFirst(parts[0] ?? '');
    setEditLast(parts.slice(1).join(' ') ?? '');
    setEditEmail(v.email);
    setEditPhone(v.phone_number ?? '');
    setEditStatus(v.status ?? 1);
    setEditShopName(v.shop_name ?? '');
    setEditCity(v.city_district ?? '');
    setEditAddress(v.address ?? '');
    setEditBusinessWhatsapp(v.store?.business_whatsapp_url ?? '');
    setEditLogoFile(null);
    setEditBannerFile(null);
    setRemoveLogo(false);
    setRemoveBanner(false);
    setEditOpen(true);
  };

  const submitEditVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVendor) return;
    const fd = new FormData();
    fd.append('first_name', editFirst);
    fd.append('last_name', editLast);
    fd.append('email', editEmail);
    if (editPhone) fd.append('phone_number', editPhone);
    fd.append('status', String(editStatus));
    if (editShopName) fd.append('shop_name', editShopName);
    if (editCity) fd.append('city_district', editCity);
    if (editAddress) fd.append('address', editAddress);
    if (editBusinessWhatsapp.trim()) fd.append('business_whatsapp_url', editBusinessWhatsapp.trim());
    if (editLogoFile) fd.append('logo', editLogoFile);
    if (editBannerFile) fd.append('banner', editBannerFile);
    if (removeLogo) fd.append('remove_logo', '1');
    if (removeBanner) fd.append('remove_banner', '1');
    const res = await patchForm(`/api/admin/vendors/${editVendor.id}`, fd);
    if (res.ok) {
      setEditOpen(false);
      showToast('Vendor updated.', 'success');
      router.reload({ only: ['vendors'] });
    } else {
      showToast('Failed to update vendor.', 'error');
    }
  };

  const deleteVendor = async (id: number) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;
    const res = await requestJson('DELETE', `/api/users/${id}`, {});
    if (res.ok) {
      showToast('Vendor deleted.', 'success');
      router.reload({ only: ['vendors'] });
    } else {
      showToast('Failed to delete vendor.', 'error');
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
                    <Input placeholder="Shop name" value={shopName} onChange={(e) => setShopName(e.target.value)} />
                    <Input placeholder="Mobile number" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
                    <Input
                      placeholder="Business WhatsApp link (https://wa.me/...)"
                      value={businessWhatsappUrl}
                      onChange={(e) => setBusinessWhatsappUrl(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Location / City" value={locationCity} onChange={(e) => setLocationCity(e.target.value)} />
                      <Input placeholder="Store name" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                    </div>
                    <Input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-sm">Store logo</label>
                        <Input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm">Store banner</label>
                        <Input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)} />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm">Status</label>
                      <select
                        className="w-full rounded-md border px-2 py-2"
                        value={statusValue}
                        onChange={(e) => setStatusValue(e.target.value as '1' | '0')}
                      >
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                      </select>
                    </div>
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
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle>Vendors</CardTitle>
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <select
                  className="w-full rounded-md border px-2 py-1 text-sm md:w-32"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as 'all' | 'active' | 'inactive',
                    )
                  }
                >
                  <option value="all">All status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select
                  className="w-full rounded-md border px-2 py-1 text-sm md:w-32"
                  value={roleFilter}
                  onChange={(e) =>
                    setRoleFilter(e.target.value as 'all' | 'vendor')
                  }
                >
                  <option value="all">All roles</option>
                  <option value="vendor">Vendor</option>
                </select>
                <Input
                  placeholder="Search by name, email, status, or store..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="md:w-72"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="hidden md:block w-full overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide"
                      onClick={() => toggleSort('name')}
                    >
                      Name
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide"
                      onClick={() => toggleSort('email')}
                    >
                      Email
                    </button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead className="hidden md:table-cell">Store</TableHead>
                  <TableHead className="hidden lg:table-cell">Shop Name</TableHead>
                  <TableHead className="hidden lg:table-cell">City</TableHead>
                  <TableHead className="hidden lg:table-cell">Address</TableHead>

                  <TableHead className="hidden sm:table-cell">Store Status</TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide cursor-pointer"
                      onClick={() => toggleSort('status')}
                    >
                      Status
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedVendors.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="whitespace-nowrap">{v.name}</TableCell>
                    <TableCell className="whitespace-nowrap">{v.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{v.phone_number ?? '—'}</TableCell>
                    <TableCell className="hidden md:table-cell">{v.store ? v.store.name : '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell">{v.shop_name ?? '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell">{v.city_district ?? '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell">{v.address ?? '—'}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {v.store ? (
                        <Badge variant={v.store.status === 'active' ? 'default' : 'outline'}>
                          {v.store.status === 'active' ? 'Approved' : v.store.status === 'suspended' ? 'Suspended' : 'Pending'}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={v.status == 1 ? 'default' : 'outline'}>
                        {v.status == 1 ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openEditVendor(v)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => deleteVendor(v.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                          {v.store && (
                            <DropdownMenuItem
                              onClick={() =>
                                v.store!.status === 'active'
                                  ? suspendStore(v.store!.id)
                                  : approveStore(v.store!.id)
                              }
                            >
                              {v.store.status === 'active' ? 'Unapprove Store' : 'Approve Store'}
                            </DropdownMenuItem>
                          )}
                          {!v.store && (
                            <DropdownMenuItem onClick={() => openAddStoreDialog(v.id)}>
                              Approve Store (Create)
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openResetPassword(v.id)}>
                            Reset Password
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
            </div>
            <div className="md:hidden grid gap-2 p-3">
              {sortedVendors.map((v) => (
                <div key={v.id} className="rounded-lg border p-3">
                  <div className="font-medium">{v.name}</div>
                  <div className="text-sm text-muted-foreground">{v.email}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{v.phone_number ?? '—'}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{v.store ? v.store.name : '—'}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant={v.store && v.store.status === 'active' ? 'default' : 'outline'}>
                      {v.store ? (v.store.status === 'active' ? 'Approved' : v.store.status === 'suspended' ? 'Suspended' : 'Pending') : 'Pending'}
                    </Badge>
                    <Badge variant={v.status == 1 ? 'default' : 'outline'}>{v.status == 1 ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">Actions</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditVendor(v)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => deleteVendor(v.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                        {v.store && (
                          <DropdownMenuItem
                            onClick={() =>
                              v.store!.status === 'active'
                                ? suspendStore(v.store!.id)
                                : approveStore(v.store!.id)
                            }
                          >
                            {v.store.status === 'active' ? 'Unapprove Store' : 'Approve Store'}
                          </DropdownMenuItem>
                        )}
                        {!v.store && (
                          <DropdownMenuItem onClick={() => openAddStoreDialog(v.id)}>
                            Approve Store (Create)
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => openResetPassword(v.id)}>
                          Reset Password
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[520px]">
            <form onSubmit={submitEditVendor}>
              <DialogHeader>
                <DialogTitle>Edit Vendor</DialogTitle>
                <DialogDescription>Update vendor account details.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="First name" value={editFirst} onChange={(e) => setEditFirst(e.target.value)} />
                  <Input placeholder="Last name" value={editLast} onChange={(e) => setEditLast(e.target.value)} />
                </div>
                <Input placeholder="Email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                <Input placeholder="Phone number" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                <Input
                  placeholder="Business WhatsApp link (https://wa.me/...)"
                  value={editBusinessWhatsapp}
                  onChange={(e) => setEditBusinessWhatsapp(e.target.value)}
                />
                <Input placeholder="Shop name" value={editShopName} onChange={(e) => setEditShopName(e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Location / City" value={editCity} onChange={(e) => setEditCity(e.target.value)} />
                  <div>
                    {/* <label className="mb-1 block text-sm">Status</label> */}
                    <select
                      className="w-full rounded-md border px-2 py-2"
                      value={String(editStatus)}
                      onChange={(e) => setEditStatus(Number(e.target.value))}
                    >
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </div>
                </div>
                <Input placeholder="Address" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-sm">New logo</label>
                    <Input type="file" accept="image/*" onChange={(e) => setEditLogoFile(e.target.files?.[0] ?? null)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm">New banner</label>
                    <Input type="file" accept="image/*" onChange={(e) => setEditBannerFile(e.target.files?.[0] ?? null)} />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

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
