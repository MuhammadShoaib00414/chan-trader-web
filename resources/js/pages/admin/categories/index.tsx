import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { postJson } from '@/lib/http';

export default function CategoriesIndex() {
  type CategoryItem = { id: number; name: string; slug: string; sort_order: number; is_active: boolean };
  const { props } = usePage<{ items: CategoryItem[] }>();
  const items = props.items;
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await postJson('/api/admin/categories', { name, slug });
    if (res.ok) {
      setName('');
      setSlug('');
      router.reload({ only: ['items'] });
    }
  };

  return (
    <AppLayout breadcrumbs={[{ title: 'Categories', href: '/admin/categories' }]}>
      <Head title="Categories" />
      <div className="grid gap-6 p-4">
        <form onSubmit={submit} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Resistors" />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm">Slug</label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="resistors" />
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
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.id}</TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.slug}</TableCell>
                  <TableCell>{c.is_active ? 'Yes' : 'No'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
