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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.id}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.slug}</TableCell>
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
      </div>
    </AppLayout>
  );
}
