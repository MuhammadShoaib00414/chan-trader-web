import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo, useState } from 'react';
import { delJson, patchJson, postJson, postForm } from '@/lib/http';
import { ToastStack } from '@/components/ui/toast-stack';

export default function ProductShow() {
  type Variant = { id: number; sku: string | null; price: number | null; stock: number; is_active: boolean };
  type Image = { id: number; path: string; is_primary: boolean };
  type Attribute = { id: number; name: string; value: string; unit: string | null };
  type ProductDetails = {
    id: number;
    name: string;
    slug: string;
    sku: string;
    price: number;
    feature_image?: string | null;
    top_image?: string | null;
    variants: Variant[];
    images: Image[];
    attributes: Attribute[];
  };
  const { props } = usePage<{ product: ProductDetails }>();
  const product = props.product;

  const [vSku, setVSku] = useState('');
  const [vPrice, setVPrice] = useState('');
  const [vStock, setVStock] = useState('');

  const [aName, setAName] = useState('');
  const [aValue, setAValue] = useState('');
  const [aUnit, setAUnit] = useState('');

  const [imgPath, setImgPath] = useState('');
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const galleryPreview = useMemo(() => (galleryFile ? URL.createObjectURL(galleryFile) : ''), [galleryFile]);
  const [featureFile, setFeatureFile] = useState<File | null>(null);
  const [topFile, setTopFile] = useState<File | null>(null);
  const featurePreview = useMemo(() => (featureFile ? URL.createObjectURL(featureFile) : ''), [featureFile]);
  const topPreview = useMemo(() => (topFile ? URL.createObjectURL(topFile) : ''), [topFile]);

  const [toasts, setToasts] = useState<Array<{ id: number; title: string; variant: 'success' | 'error' }>>([]);
  const dismissToast = (id: number) => setToasts((ts) => ts.filter((t) => t.id !== id));
  const showToast = (title: string, variant: 'success' | 'error' = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((ts) => [...ts, { id, title, variant }]);
    setTimeout(() => dismissToast(id), 2500);
  };
  const errorMessageFromResponse = async (res: Response): Promise<string> => {
    try {
      const data = (await res.json()) as any;
      if (data?.message && typeof data.message === 'string') return data.message;
      const firstError = data?.errors ? Object.values<any>(data.errors)?.flat()?.[0] : null;
      if (firstError && typeof firstError === 'string') return firstError;
      return `Request failed (${res.status}).`;
    } catch {
      return `Request failed (${res.status}).`;
    }
  };

  const [variantEdits, setVariantEdits] = useState<Record<number, { sku: string; price: string; stock: string }>>({});
  const [attrEdits, setAttrEdits] = useState<Record<number, { name: string; value: string; unit: string }>>({});

  const getVariantEdit = (v: Variant) => variantEdits[v.id] ?? { sku: v.sku ?? '', price: v.price != null ? String(v.price) : '', stock: String(v.stock) };
  const getAttrEdit = (a: Attribute) => attrEdits[a.id] ?? { name: a.name, value: a.value, unit: a.unit ?? '' };

  const setVariantField = (id: number, field: 'sku' | 'price' | 'stock', val: string) =>
    setVariantEdits((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? { sku: '', price: '', stock: '' }),
        [field]: val,
      },
    }));

  const setAttrField = (id: number, field: 'name' | 'value' | 'unit', val: string) =>
    setAttrEdits((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? { name: '', value: '', unit: '' }),
        [field]: val,
      },
    }));

  const addVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await postJson(`/api/admin/products/${product.id}/variants`, {
      sku: vSku || null,
      price: vPrice ? Number(vPrice) : null,
      stock: vStock ? Number(vStock) : 0,
    });
    if (res.ok) {
      setVSku('');
      setVPrice('');
      setVStock('');
      router.reload({ only: ['product'] });
    }
  };

  const saveVariant = async (v: Variant) => {
    const e = getVariantEdit(v);
    const res = await patchJson(`/api/admin/products/${product.id}/variants/${v.id}`, {
      sku: e.sku || null,
      price: e.price ? Number(e.price) : null,
      stock: e.stock ? Number(e.stock) : 0,
    });
    if (res.ok) {
      router.reload({ only: ['product'] });
    }
  };

  const deleteVariant = async (v: Variant) => {
    const res = await delJson(`/api/admin/products/${product.id}/variants/${v.id}`);
    if (res.ok) {
      router.reload({ only: ['product'] });
    }
  };

  const addAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await postJson(`/api/admin/products/${product.id}/attributes`, { name: aName, value: aValue, unit: aUnit || null });
    if (res.ok) {
      setAName('');
      setAValue('');
      setAUnit('');
      router.reload({ only: ['product'] });
    }
  };

  const saveAttribute = async (a: Attribute) => {
    const e = getAttrEdit(a);
    const res = await patchJson(`/api/admin/products/${product.id}/attributes/${a.id}`, {
      name: e.name,
      value: e.value,
      unit: e.unit || null,
    });
    if (res.ok) {
      router.reload({ only: ['product'] });
    }
  };

  const deleteAttribute = async (a: Attribute) => {
    const res = await delJson(`/api/admin/products/${product.id}/attributes/${a.id}`);
    if (res.ok) {
      router.reload({ only: ['product'] });
    }
  };

  const addImage = async (e: React.FormEvent) => {
    e.preventDefault();
    let res;
    if (imgPath) {
      res = await postJson(`/api/admin/products/${product.id}/images`, { path: imgPath });
    } else {
      if (!galleryFile) return;
      const form = new FormData();
      form.append('file', galleryFile);
      res = await postForm(`/api/admin/products/${product.id}/images`, form);
    }
    if (res.ok) {
      setImgPath('');
      setGalleryFile(null);
      router.reload({ only: ['product'] });
      showToast('Gallery image uploaded.', 'success');
    } else {
      showToast(await errorMessageFromResponse(res), 'error');
    }
  };

  const deleteImage = async (imgId: number) => {
    const res = await delJson(`/api/admin/products/${product.id}/images/${imgId}`);
    if (res.ok) {
      router.reload({ only: ['product'] });
    }
  };

  return (
    <AppLayout breadcrumbs={[{ title: 'Products', href: '/admin/products' }, { title: product.name, href: `/admin/products/${product.id}` }]}>
      <Head title={`Product: ${product.name}`} />
      <div className="grid gap-6 p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">{product.name}</CardTitle>
              <CardDescription>SKU: {product.sku} • Price: ${product.price}</CardDescription>
            </div>
            {product.feature_image && (
              <img src={product.feature_image} alt="" className="h-16 w-16 rounded-md border object-cover" />
            )}
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Variants</CardTitle>
            </CardHeader>
            <CardContent>
            <form onSubmit={addVariant} className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
              <Input value={vSku} onChange={(e) => setVSku(e.target.value)} placeholder="Variant SKU" />
              <Input value={vPrice} onChange={(e) => setVPrice(e.target.value)} placeholder="Price" />
              <Input value={vStock} onChange={(e) => setVStock(e.target.value)} placeholder="Stock" />
              <Button type="submit">Add</Button>
            </form>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.variants?.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>{v.id}</TableCell>
                    <TableCell>
                      <Input value={getVariantEdit(v).sku} onChange={(e) => setVariantField(v.id, 'sku', e.target.value)} placeholder="SKU" />
                    </TableCell>
                    <TableCell>
                      <Input value={getVariantEdit(v).price} onChange={(e) => setVariantField(v.id, 'price', e.target.value)} placeholder="Price" />
                    </TableCell>
                    <TableCell>
                      <Input value={getVariantEdit(v).stock} onChange={(e) => setVariantField(v.id, 'stock', e.target.value)} placeholder="Stock" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => saveVariant(v)}>Save</Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteVariant(v)}>Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attributes</CardTitle>
            </CardHeader>
            <CardContent>
            <form onSubmit={addAttribute} className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
              <Input value={aName} onChange={(e) => setAName(e.target.value)} placeholder="Name" />
              <Input value={aValue} onChange={(e) => setAValue(e.target.value)} placeholder="Value" />
              <Input value={aUnit} onChange={(e) => setAUnit(e.target.value)} placeholder="Unit (optional)" />
              <Button type="submit">Add</Button>
            </form>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.attributes?.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <Input value={getAttrEdit(a).name} onChange={(e) => setAttrField(a.id, 'name', e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <Input value={getAttrEdit(a).value} onChange={(e) => setAttrField(a.id, 'value', e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <Input value={getAttrEdit(a).unit} onChange={(e) => setAttrField(a.id, 'unit', e.target.value)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => saveAttribute(a)}>Save</Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteAttribute(a)}>Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Images</CardTitle>
            <CardDescription>Upload gallery images or paste an existing path</CardDescription>
          </CardHeader>
          <CardContent>
          <form onSubmit={addImage} className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-3 md:items-end">
            <div className="flex-1">
              <Input value={imgPath} onChange={(e) => setImgPath(e.target.value)} placeholder="/images/path.png" />
            </div>
            <div className="flex-1">
              <input
                id="gallery-file"
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.svg"
                className="w-full rounded-md border px-2 py-2"
                onChange={(e) => setGalleryFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <Button type="submit">Add</Button>
          </form>
          {galleryPreview && (
            <div className="mb-3">
              <div className="text-sm text-muted-foreground">Preview</div>
              <img src={galleryPreview} alt="" className="h-24 w-24 rounded-md border object-cover" />
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Primary</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.images?.map((img) => (
                <TableRow key={img.id}>
                  <TableCell>{img.id}</TableCell>
                  <TableCell>
                    <img src={img.path} alt="" className="h-12 w-12 rounded-md border object-cover" />
                  </TableCell>
                  <TableCell>{img.path}</TableCell>
                  <TableCell>{img.is_primary ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!img.is_primary && (
                        <Button size="sm" variant="outline" onClick={async () => {
                          const res = await patchJson(`/api/admin/products/${product.id}/images/${img.id}/primary`, {});
                          if (res.ok) router.reload({ only: ['product'] });
                        }}>Make Primary</Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => deleteImage(img.id)}>Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Feature Image</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="mb-3">
              {featurePreview ? (
                <img src={featurePreview} alt="" className="h-32 w-32 rounded-md border object-cover" />
              ) : product.feature_image ? (
                <img src={product.feature_image} alt="" className="h-32 w-32 rounded-md border object-cover" />
              ) : (
                <div className="text-sm text-muted-foreground">No feature image set</div>
              )}
            </div>
            <div className="flex items-end gap-2">
              <Input type="file" accept=".png,.jpg,.jpeg,.webp,.svg" onChange={(e) => setFeatureFile(e.target.files?.[0] ?? null)} />
              <Button onClick={async () => {
                if (!featureFile) return;
                const form = new FormData();
                form.append('file', featureFile);
                const res = await postForm(`/api/admin/products/${product.id}/feature-image`, form);
                if (res.ok) {
                  router.reload({ only: ['product'] });
                  showToast('Feature image uploaded.', 'success');
                } else {
                  showToast(await errorMessageFromResponse(res), 'error');
                }
              }}>
                Upload
              </Button>
            </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Image</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="mb-3">
              {topPreview ? (
                <img src={topPreview} alt="" className="h-32 w-32 rounded-md border object-cover" />
              ) : product.top_image ? (
                <img src={product.top_image} alt="" className="h-32 w-32 rounded-md border object-cover" />
              ) : (
                <div className="text-sm text-muted-foreground">No top image set</div>
              )}
            </div>
            <div className="flex items-end gap-2">
              <Input type="file" accept=".png,.jpg,.jpeg,.webp,.svg" onChange={(e) => setTopFile(e.target.files?.[0] ?? null)} />
              <Button onClick={async () => {
                if (!topFile) return;
                const form = new FormData();
                form.append('file', topFile);
                const res = await postForm(`/api/admin/products/${product.id}/top-image`, form);
                if (res.ok) {
                  router.reload({ only: ['product'] });
                  showToast('Top image uploaded.', 'success');
                } else {
                  showToast(await errorMessageFromResponse(res), 'error');
                }
              }}>
                Upload
              </Button>
            </div>
            </CardContent>
          </Card>
        </div>
        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </div>
    </AppLayout>
  );
}
