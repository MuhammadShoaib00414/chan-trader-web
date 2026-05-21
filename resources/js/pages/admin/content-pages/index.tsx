import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RichTextEditor } from '@/components/rich-text-editor';
import { ToastStack } from '@/components/ui/toast-stack';
import { patchJson, requestJson } from '@/lib/http';
import { Pencil } from 'lucide-react';
import { useState } from 'react';

type PageSummary = {
  slug: string;
  title: string;
  is_published: boolean;
  updated_at?: string | null;
};

type PageDetail = PageSummary & {
  content?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
};

interface ContentPagesProps {
  pages: PageSummary[];
}

export default function ContentPagesIndex({ pages }: ContentPagesProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<PageDetail | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: number; title: string; variant: 'success' | 'error' }>>([]);

  const showToast = (t: string, variant: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((ts) => [...ts, { id, title: t, variant }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 2500);
  };

  const openEdit = async (slug: string) => {
    const res = await requestJson('GET', `/api/admin/content-pages/${slug}`);
    if (!res.ok) {
      showToast('Failed to load page.', 'error');
      return;
    }
    const json = (await res.json()) as { data: PageDetail };
    const page = json.data;
    setEditing(page);
    setTitle(page.title);
    setContent(page.content ?? '');
    setIsPublished(page.is_published ?? true);
    setMetaTitle(page.meta_title ?? '');
    setMetaDescription(page.meta_description ?? '');
    setEditOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const res = await patchJson(`/api/admin/content-pages/${editing.slug}`, {
      title,
      content,
      is_published: isPublished,
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
    });
    setSaving(false);
    if (res.ok) {
      setEditOpen(false);
      showToast('Page saved.');
    } else {
      showToast('Failed to save page.', 'error');
    }
  };

  return (
    <AppLayout>
      <Head title="Content Pages" />
      <div className="flex flex-col gap-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Content Pages</CardTitle>
            <CardDescription>Manage legal and informational pages for the mobile app</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.slug}>
                    <TableCell className="font-medium">{page.title}</TableCell>
                    <TableCell className="text-muted-foreground">{page.slug}</TableCell>
                    <TableCell>{page.is_published ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openEdit(page.slug)}>
                        <Pencil className="mr-1 h-4 w-4" /> Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit {editing?.title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={isPublished} onCheckedChange={(v) => setIsPublished(!!v)} /> Published
            </label>
            <RichTextEditor value={content} onChange={setContent} placeholder="Page content…" />
            <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Meta title (optional)" />
            <Input value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} placeholder="Meta description (optional)" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </AppLayout>
  );
}
