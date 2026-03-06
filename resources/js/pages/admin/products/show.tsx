import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState } from 'react';
import { delJson, patchJson, postJson } from '@/lib/http';

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
    const res = await postJson(`/api/admin/products/${product.id}/images`, { path: imgPath });
    if (res.ok) {
      setImgPath('');
      router.reload({ only: ['product'] });
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
        <div className="rounded-lg border p-4">
          <div className="text-lg font-medium">{product.name}</div>
          <div className="text-sm text-muted-foreground">SKU: {product.sku} • Price: ${product.price}</div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="mb-3 font-medium">Variants</div>
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
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-3 font-medium">Attributes</div>
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
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="mb-3 font-medium">Images</div>
          <form onSubmit={addImage} className="mb-3 flex items-end gap-2">
            <div className="flex-1">
              <Input value={imgPath} onChange={(e) => setImgPath(e.target.value)} placeholder="/images/path.png" />
            </div>
            <Button type="submit">Add</Button>
          </form>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Primary</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.images?.map((img) => (
                <TableRow key={img.id}>
                  <TableCell>{img.id}</TableCell>
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
        </div>
      </div>
    </AppLayout>
  );
}
