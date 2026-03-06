import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { postJson } from '@/lib/http';

export default function BrandsIndex() {
  type BrandItem = { id: number; name: string; slug: string };
  const { props } = usePage<{ items: BrandItem[] }>();
  const items = props.items;
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await postJson('/api/admin/brands', { name, slug });
    if (res.ok) {
      setName('');
      setSlug('');
      router.reload({ only: ['items'] });
    }
  };

  return (
    <AppLayout breadcrumbs={[{ title: 'Brands', href: '/admin/brands' }]}>
      <Head title="Brands" />
      <div className="grid gap-6 p-4">
        <form onSubmit={submit} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Texas Instruments" />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm">Slug</label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="texas-instruments" />
          </div>
          <Button type="submit">Add</Button>
        </form>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{b.id}</TableCell>
                  <TableCell>{b.name}</TableCell>
                  <TableCell>{b.slug}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
