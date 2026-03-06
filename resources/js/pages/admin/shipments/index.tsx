import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ShipmentsIndex() {
  type Shipment = { id: number; order_id: number; store_id: number; carrier: string | null; tracking_no: string | null; status: string; shipped_at: string | null; delivered_at: string | null };
  type Pagination = { total: number; per_page: number; current_page: number; last_page: number };
  const { props } = usePage<{ items: Shipment[]; pagination: Pagination; filters: { q?: string; status?: string } }>();
  const items = props.items;
  const pagination = props.pagination;
  const filters = props.filters || {};
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const q = String(data.get('q') || '');
    const status = String(data.get('status') || '');
    router.get('/admin/shipments', { q: q || undefined, status: status || undefined }, { preserveState: true, preserveScroll: true, only: ['items', 'pagination', 'filters'] });
  };
  const goto = (page: number) => {
    router.get('/admin/shipments', { ...filters, page }, { preserveState: true, preserveScroll: true, only: ['items', 'pagination'] });
  };
  return (
    <AppLayout breadcrumbs={[{ title: 'Shipments', href: '/admin/shipments' }]}>
      <Head title="Shipments" />
      <div className="p-4 space-y-3">
        <form onSubmit={submit} className="flex flex-col gap-2 md:flex-row md:items-end">
          <div className="md:w-64">
            <label className="mb-1 block text-sm">Search (tracking/carrier)</label>
            <Input name="q" defaultValue={filters.q ?? ''} placeholder="Tracking or Carrier" />
          </div>
          <div className="md:w-40">
            <label className="mb-1 block text-sm">Status</label>
            <select className="w-full rounded-md border px-2 py-2" name="status" defaultValue={filters.status ?? ''}>
              <option value="">All</option>
              <option value="pending">pending</option>
              <option value="shipped">shipped</option>
              <option value="in_transit">in_transit</option>
              <option value="delivered">delivered</option>
              <option value="failed">failed</option>
              <option value="returned">returned</option>
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
                <TableHead>Order</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Shipped</TableHead>
                <TableHead>Delivered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.id}</TableCell>
                  <TableCell>{s.order_id}</TableCell>
                  <TableCell>{s.store_id}</TableCell>
                  <TableCell>{s.carrier ?? '-'}</TableCell>
                  <TableCell>{s.tracking_no ?? '-'}</TableCell>
                  <TableCell className="capitalize">{s.status}</TableCell>
                  <TableCell>{s.shipped_at ? new Date(s.shipped_at).toLocaleString() : '-'}</TableCell>
                  <TableCell>{s.delivered_at ? new Date(s.delivered_at).toLocaleString() : '-'}</TableCell>
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
