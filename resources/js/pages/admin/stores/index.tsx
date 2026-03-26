import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { postJson } from '@/lib/http';

export default function StoresIndex() {
  type StoreItem = { id: number; name: string; slug: string; status: string };
  const { props } = usePage<{ items: StoreItem[] }>();
  const items = props.items;

  const approve = async (id: number) => {
    const res = await postJson(`/api/admin/stores/${id}/approve`);
    if (res.ok) router.reload({ only: ['items'] });
  };
  const suspend = async (id: number) => {
    const res = await postJson(`/api/admin/stores/${id}/suspend`);
    if (res.ok) router.reload({ only: ['items'] });
  };

  return (
    <AppLayout breadcrumbs={[{ title: 'Stores', href: '/admin/stores' }]}>
      <Head title="Stores" />
      <div className="p-4">
        <div className="rounded-lg border">
          <div className="hidden md:block w-full overflow-x-auto">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">ID</TableHead>
                <TableHead className="whitespace-nowrap">Name</TableHead>
                <TableHead className="hidden md:table-cell">Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.id}</TableCell>
                  <TableCell className="whitespace-nowrap">{s.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{s.slug}</TableCell>
                  <TableCell className="capitalize">{s.status}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => approve(s.id)}>Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => suspend(s.id)}>Suspend</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          <div className="md:hidden grid gap-2 p-3">
            {items?.map((s) => (
              <div key={s.id} className="rounded-lg border p-3">
                <div className="font-medium">{s.name}</div>
                <div className="text-sm text-muted-foreground">{s.slug}</div>
                <div className="mt-1 text-xs capitalize text-muted-foreground">Status: {s.status}</div>
                <div className="mt-2 flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => approve(s.id)}>Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => suspend(s.id)}>Suspend</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
