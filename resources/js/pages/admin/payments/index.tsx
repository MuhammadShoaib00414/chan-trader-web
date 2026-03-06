import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function PaymentsIndex() {
  type Payment = { id: number; order_id: number; method: string; amount: number; status: string; paid_at: string | null };
  type Pagination = { total: number; per_page: number; current_page: number; last_page: number };
  const { props } = usePage<{ items: Payment[]; pagination: Pagination; filters: { q?: string; status?: string; method?: string } }>();
  const items = props.items;
  const pagination = props.pagination;
  const filters = props.filters || {};
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const q = String(data.get('q') || '');
    const status = String(data.get('status') || '');
    const method = String(data.get('method') || '');
    router.get('/admin/payments', { q: q || undefined, status: status || undefined, method: method || undefined }, { preserveState: true, preserveScroll: true, only: ['items', 'pagination', 'filters'] });
  };
  const goto = (page: number) => {
    router.get('/admin/payments', { ...filters, page }, { preserveState: true, preserveScroll: true, only: ['items', 'pagination'] });
  };
  return (
    <AppLayout breadcrumbs={[{ title: 'Payments', href: '/admin/payments' }]}>
      <Head title="Payments" />
      <div className="p-4 space-y-3">
        <form onSubmit={submit} className="flex flex-col gap-2 md:flex-row md:items-end">
          <div className="md:w-64">
            <label className="mb-1 block text-sm">Search (txn/order)</label>
            <Input name="q" defaultValue={filters.q ?? ''} placeholder="Txn ID or Order ID" />
          </div>
          <div className="md:w-40">
            <label className="mb-1 block text-sm">Method</label>
            <select className="w-full rounded-md border px-2 py-2" name="method" defaultValue={filters.method ?? ''}>
              <option value="">All</option>
              <option value="cod">cod</option>
              <option value="card">card</option>
              <option value="bank">bank</option>
              <option value="wallet">wallet</option>
            </select>
          </div>
          <div className="md:w-40">
            <label className="mb-1 block text-sm">Status</label>
            <select className="w-full rounded-md border px-2 py-2" name="status" defaultValue={filters.status ?? ''}>
              <option value="">All</option>
              <option value="initiated">initiated</option>
              <option value="succeeded">succeeded</option>
              <option value="failed">failed</option>
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
                <TableHead>Order</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paid At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>{p.order_id}</TableCell>
                  <TableCell>{p.method}</TableCell>
                  <TableCell>${p.amount}</TableCell>
                  <TableCell className="capitalize">{p.status}</TableCell>
                  <TableCell>{p.paid_at ? new Date(p.paid_at).toLocaleString() : '-'}</TableCell>
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
