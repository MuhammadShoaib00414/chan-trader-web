import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { postJson, patchJson } from '@/lib/http';

export default function OrderShow() {
  type TimelineItem = { from_status: string | null; to_status: string; comment: string | null; created_at: string };
  type Payment = { id: number; method: string; amount: number; status: string; paid_at: string | null };
  type Shipment = { id: number; store_id: number; carrier: string | null; tracking_no: string | null; status: string; shipped_at: string | null; delivered_at: string | null };
  type StoreRef = { id: number; name: string };
  type OrderDetails = { id: number; code: string; status: string; payment_status: string; grand_total: number; currency: string; created_at: string };
  const { props } = usePage<{ order: OrderDetails; timeline: TimelineItem[]; payments: Payment[]; shipments: Shipment[]; stores: StoreRef[] }>();
  const { order, timeline, payments, shipments, stores } = props;

  const [toStatus, setToStatus] = useState('confirmed');
  const [statusComment, setStatusComment] = useState('');
  const [payAmount, setPayAmount] = useState(String(order.grand_total));
  const [payMethod, setPayMethod] = useState('card');
  const [providerTxn, setProviderTxn] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [shipStore, setShipStore] = useState(stores?.[0]?.id ?? 0);
  const [shipCarrier, setShipCarrier] = useState('');
  const [shipTracking, setShipTracking] = useState('');
  const [shipCost, setShipCost] = useState('0');
  const [shipStatusEdits, setShipStatusEdits] = useState<Record<number, string>>({});
  const setShipStatus = (id: number, status: string) => setShipStatusEdits((prev) => ({ ...prev, [id]: status }));
  const saveShipStatus = async (id: number, current: string) => {
    const status = shipStatusEdits[id] ?? current;
    const res = await patchJson(`/api/admin/shipments/${id}`, { status });
    if (res.ok) router.reload({ only: ['shipments'] });
  };

  const updateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await patchJson(`/api/admin/orders/${order.id}/status`, { to_status: toStatus, comment: statusComment || null });
    if (res.ok) router.reload({ only: ['order', 'timeline'] });
  };
  const capturePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await postJson(`/api/admin/orders/${order.id}/payments`, { method: payMethod, amount: Number(payAmount), provider_txn_id: providerTxn || null });
    if (res.ok) router.reload({ only: ['payments', 'order'] });
  };
  const refund = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await postJson(`/api/admin/orders/${order.id}/refund`, { amount: Number(refundAmount), reason: refundReason || null });
    if (res.ok) router.reload({ only: ['payments', 'order'] });
  };
  const createShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await postJson(`/api/admin/orders/${order.id}/shipments`, { store_id: Number(shipStore), carrier: shipCarrier || null, tracking_no: shipTracking || null, cost: Number(shipCost) || 0 });
    if (res.ok) router.reload({ only: ['shipments'] });
  };

  return (
    <AppLayout breadcrumbs={[{ title: 'Orders', href: '/admin/orders' }, { title: order.code, href: `/admin/orders/${order.id}` }]}>
      <Head title={`Order ${order.code}`} />
      <div className="grid gap-6 p-4">
        <div className="rounded-lg border p-4">
          <div className="text-lg font-medium">Order {order.code}</div>
          <div className="text-sm text-muted-foreground capitalize">Status: {order.status} • Payment: {order.payment_status} • Total: ${order.grand_total}</div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="mb-3 font-medium">Update Status</div>
            <form onSubmit={updateStatus} className="flex flex-col gap-2 md:flex-row">
              <select className="w-full rounded-md border px-2 py-2 md:w-48" value={toStatus} onChange={(e) => setToStatus(e.target.value)}>
                <option value="pending">pending</option>
                <option value="confirmed">confirmed</option>
                <option value="packed">packed</option>
                <option value="shipped">shipped</option>
                <option value="delivered">delivered</option>
                <option value="cancelled">cancelled</option>
                <option value="refunded">refunded</option>
              </select>
              <Input value={statusComment} onChange={(e) => setStatusComment(e.target.value)} placeholder="Comment (optional)" />
              <Button type="submit">Apply</Button>
            </form>
            <div className="mt-4">
              <div className="mb-2 font-medium">Timeline</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeline?.map((t, i) => (
                    <TableRow key={i}>
                      <TableCell>{t.from_status ?? '-'}</TableCell>
                      <TableCell>{t.to_status}</TableCell>
                      <TableCell>{t.comment ?? '-'}</TableCell>
                      <TableCell>{new Date(t.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-3 font-medium">Payments</div>
            <form onSubmit={capturePayment} className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
              <select className="w-full rounded-md border px-2 py-2" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                <option value="cod">cod</option>
                <option value="card">card</option>
                <option value="bank">bank</option>
                <option value="wallet">wallet</option>
              </select>
              <Input value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Amount" />
              <Input value={providerTxn} onChange={(e) => setProviderTxn(e.target.value)} placeholder="Provider Txn (optional)" />
              <Button type="submit">Capture</Button>
            </form>
            <form onSubmit={refund} className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
              <Input value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} placeholder="Refund amount" />
              <Input value={refundReason} onChange={(e) => setRefundReason(e.target.value)} placeholder="Reason (optional)" />
              <div />
              <Button type="submit" variant="destructive">Refund</Button>
            </form>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.id}</TableCell>
                    <TableCell>{p.method}</TableCell>
                    <TableCell>${p.amount}</TableCell>
                    <TableCell className="capitalize">{p.status}</TableCell>
                    <TableCell>{p.paid_at ? new Date(p.paid_at).toLocaleString() : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="mb-3 font-medium">Shipments</div>
          <form onSubmit={createShipment} className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-6">
            <select className="w-full rounded-md border px-2 py-2" value={String(shipStore)} onChange={(e) => setShipStore(Number(e.target.value))}>
              {stores?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <Input value={shipCarrier} onChange={(e) => setShipCarrier(e.target.value)} placeholder="Carrier" />
            <Input value={shipTracking} onChange={(e) => setShipTracking(e.target.value)} placeholder="Tracking No" />
            <Input value={shipCost} onChange={(e) => setShipCost(e.target.value)} placeholder="Cost" />
            <div />
            <Button type="submit">Create Shipment</Button>
          </form>
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>Tracking</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments?.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.id}</TableCell>
                  <TableCell>{s.store_id}</TableCell>
                  <TableCell>{s.carrier ?? '-'}</TableCell>
                  <TableCell>{s.tracking_no ?? '-'}</TableCell>
                    <TableCell>
                      <select className="w-full rounded-md border px-2 py-2 capitalize" value={shipStatusEdits[s.id] ?? s.status} onChange={(e) => setShipStatus(s.id, e.target.value)}>
                        <option value="pending">pending</option>
                        <option value="shipped">shipped</option>
                        <option value="in_transit">in_transit</option>
                        <option value="delivered">delivered</option>
                        <option value="failed">failed</option>
                        <option value="returned">returned</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => saveShipStatus(s.id, s.status)}>Save</Button>
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
