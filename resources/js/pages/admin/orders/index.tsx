import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function OrdersIndex() {
  type OrderItem = { id: number; code: string; status: string; payment_status: string; grand_total: number; created_at: string };
  type Pagination = { total: number; per_page: number; current_page: number; last_page: number };
  const { props } = usePage<{ items: OrderItem[]; pagination: Pagination; filters: { q?: string; status?: string } }>();
  const items = props.items;
  const pagination = props.pagination;
  const filters = props.filters || {};
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const q = String(data.get('q') || '');
    const status = String(data.get('status') || '');
    router.get('/admin/orders', { q: q || undefined, status: status || undefined }, { preserveState: true, preserveScroll: true, only: ['items', 'pagination', 'filters'] });
  };
  const goto = (page: number) => {
    router.get('/admin/orders', { ...filters, page }, { preserveState: true, preserveScroll: true, only: ['items', 'pagination'] });
  };
  return (
    <AppLayout breadcrumbs={[{ title: 'Orders', href: '/admin/orders' }]}>
      <Head title="Orders" />
      <div className="p-4 space-y-3">
        <form onSubmit={submit} className="flex flex-col gap-2 md:flex-row md:items-end">
          <div className="md:w-64">
            <label className="mb-1 block text-sm">Search by Code</label>
            <Input name="q" defaultValue={filters.q ?? ''} placeholder="ORD-2026-0001" />
          </div>
          <div className="md:w-48">
            <label className="mb-1 block text-sm">Status</label>
            <select className="w-full rounded-md border px-2 py-2" name="status" defaultValue={filters.status ?? ''}>
              <option value="">All</option>
              <option value="pending">pending</option>
              <option value="confirmed">confirmed</option>
              <option value="packed">packed</option>
              <option value="shipped">shipped</option>
              <option value="delivered">delivered</option>
              <option value="cancelled">cancelled</option>
              <option value="refunded">refunded</option>
            </select>
          </div>
          <div>
            <Button type="submit">Filter</Button>
          </div>
        </form>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>{o.id}</TableCell>
                  <TableCell>{o.code}</TableCell>
                  <TableCell className="capitalize">{o.status}</TableCell>
                  <TableCell className="capitalize">{o.payment_status}</TableCell>
                  <TableCell>${o.grand_total}</TableCell>
                  <TableCell>{new Date(o.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/admin/orders/${o.id}`}>Manage</a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {pagination && (
          <div className="flex items-center justify-between">
            <div className="text-sm">Page {pagination.current_page} of {pagination.last_page} • Total {pagination.total}</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={pagination.current_page <= 1} onClick={() => goto(pagination.current_page - 1)}>Prev</Button>
              <Button size="sm" variant="outline" disabled={pagination.current_page >= pagination.last_page} onClick={() => goto(pagination.current_page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
