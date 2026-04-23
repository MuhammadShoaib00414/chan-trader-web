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
  type Image = { id: number; path: string; is_primary: boolean };
  type ProductDetails = {
    id: number;
    name: string;
    slug: string;
    sku: string;
    price: number;
    stock: number;
    low_stock_threshold: number;
    compare_at?: number | null;
    store_id?: number;
    category_id?: number;
    subcategory_id?: number | null;
    brand_id?: number | null;
    feature_image?: string | null;
    top_image?: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
    description?: string | null;
    warranty_text?: string | null;
    images: Image[];
  };
  type Ref = { id: number; name: string };
  type SubcategoryRef = { id: number; name: string; category_id: number };
  const { props } = usePage<{ product: ProductDetails; stores: Ref[]; categories: Ref[]; subcategories: SubcategoryRef[]; brands: Ref[] }>();
  const product = props.product;
  const stores = props.stores ?? [];
  const categories = props.categories ?? [];
  const subcategories = props.subcategories ?? [];
  const brands = props.brands ?? [];

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

  const initialDiscount = useMemo(() => {
    const c = product.compare_at ?? null;
    const p = product.price ?? 0;
    if (c && c > p && c > 0) {
      return String(Math.round(((c - p) / c) * 100));
    }
    return '';
  }, [product.compare_at, product.price]);
  const [pName, setPName] = useState(product.name);
  const [pSlug, setPSlug] = useState(product.slug);
  const [pSku, setPSku] = useState(product.sku ?? '');
  const [pPrice, setPPrice] = useState(String(product.price ?? ''));
  const [pStock, setPStock] = useState(String(product.stock ?? '0'));
  const [pLowStock, setPLowStock] = useState(String(product.low_stock_threshold ?? '10'));
  const [pDiscount, setPDiscount] = useState(initialDiscount);
  const [pThumb, setPThumb] = useState(product.feature_image ?? '');
  const [pStoreId, setPStoreId] = useState<number>(product.store_id ?? stores?.[0]?.id ?? 0);
  const [pCategoryId, setPCategoryId] = useState<number>(product.category_id ?? categories?.[0]?.id ?? 0);
  const [pSubcategoryId, setPSubcategoryId] = useState<number>(product.subcategory_id ?? 0);
  const [pBrandId, setPBrandId] = useState<number>(product.brand_id ?? 0);
  const [pMetaTitle, setPMetaTitle] = useState(product.meta_title ?? '');
  const [pMetaDescription, setPMetaDescription] = useState(product.meta_description ?? '');
  const [pDescription, setPDescription] = useState(product.description ?? '');
  const [pWarrantyText, setPWarrantyText] = useState(product.warranty_text ?? '');
  const slugify = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  type UpdatePayload = {
    name?: string;
    slug?: string;
    sku?: string | null;
    feature_image?: string | null;
    store_id?: number;
    category_id?: number;
    subcategory_id?: number | null;
    brand_id?: number | null;
    price?: number;
    stock?: number;
    low_stock_threshold?: number;
    compare_at?: number | null;
    meta_title?: string | null;
    meta_description?: string | null;
    description?: string | null;
    warranty_text?: string | null;
  };
  const filteredSubcategories = useMemo(
    () => subcategories.filter((subcategory) => subcategory.category_id === pCategoryId),
    [pCategoryId, subcategories],
  );

  const saveBasics = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: UpdatePayload = {};
    if (pName) payload.name = pName;
    if (pSlug) payload.slug = pSlug;
    if (pSku) payload.sku = pSku;
    if (pThumb || pThumb === '') payload.feature_image = pThumb || null;
    if (pStoreId) payload.store_id = pStoreId;
    if (pCategoryId) payload.category_id = pCategoryId;
    payload.subcategory_id = pSubcategoryId || null;
    if (pBrandId) payload.brand_id = pBrandId;
    if (pMetaTitle || pMetaTitle === '') payload.meta_title = pMetaTitle || null;
    if (pMetaDescription || pMetaDescription === '') payload.meta_description = pMetaDescription || null;
    payload.description = pDescription || null;
    payload.warranty_text = pWarrantyText || null;
    if (pStock) payload.stock = Number(pStock);
    if (pLowStock) payload.low_stock_threshold = Number(pLowStock);
    if (pPrice) {
      const priceVal = Number(pPrice);
      if (!Number.isNaN(priceVal)) payload.price = priceVal;
      if (pDiscount) {
        const d = Number(pDiscount);
        if (!Number.isNaN(d) && d > 0 && d < 100 && priceVal > 0) {
          const compareAt = Math.round((priceVal / (1 - d / 100)) * 100) / 100;
          payload.compare_at = compareAt;
        } else {
          payload.compare_at = null;
        }
      } else {
        payload.compare_at = null;
      }
    }
    const res = await patchJson(`/api/admin/products/${product.id}`, payload);
    if (res.ok) {
      router.reload({ only: ['product'] });
      showToast('Product updated.', 'success');
    } else {
      showToast(await errorMessageFromResponse(res), 'error');
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
      <div className="grid gap-6 p-4 max-w-7xl mx-auto">
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold">{product.name}</CardTitle>
              <CardDescription className="text-base mt-2">
                <span className="inline-flex items-center gap-4">
                  <span className="font-medium">SKU: {product.sku}</span>
                  <span className="text-lg font-semibold text-foreground">${product.price}</span>
                </span>
              </CardDescription>
            </div>
            {product.feature_image && (
              <img src={product.feature_image} alt="" className="h-24 w-24 rounded-lg border-2 object-cover shadow-sm" />
            )}
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg">Product Details</CardTitle>
            <CardDescription>Edit basic info, pricing, thumbnail, and meta</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={saveBasics} className="grid grid-cols-1 gap-4 md:grid-cols-6">
              <div className="md:col-span-3">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Name</label>
                <Input value={pName} onChange={(e) => { setPName(e.target.value); }} placeholder="Product name" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Slug</label>
                <Input value={pSlug} onChange={(e) => setPSlug(e.target.value)} placeholder="url-friendly-slug" />
              </div>
              <div className="md:col-span-1 flex items-end">
                <Button type="button" variant="outline" onClick={() => setPSlug(slugify(pName))}>Slugify</Button>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">SKU</label>
                <Input value={pSku} onChange={(e) => setPSku(e.target.value)} placeholder="SKU-0001" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Price</label>
                <Input value={pPrice} onChange={(e) => setPPrice(e.target.value)} placeholder="0.00" type="number" step="0.01" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Stock</label>
                <Input value={pStock} onChange={(e) => setPStock(e.target.value)} placeholder="0" type="number" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Low Stock Alert at</label>
                <Input value={pLowStock} onChange={(e) => setPLowStock(e.target.value)} placeholder="10" type="number" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Discount (%)</label>
                <Input value={pDiscount} onChange={(e) => setPDiscount(e.target.value)} placeholder="0" type="number" min="0" max="99" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Thumbnail URL</label>
                <Input value={pThumb} onChange={(e) => setPThumb(e.target.value)} placeholder="/storage/products/..." />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Store</label>
                <select className="w-full rounded-md border px-3 py-2" value={String(pStoreId)} onChange={(e) => setPStoreId(Number(e.target.value))}>
                  {stores?.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Category</label>
                <select
                  className="w-full rounded-md border px-3 py-2"
                  value={String(pCategoryId)}
                  onChange={(e) => {
                    const nextCategoryId = Number(e.target.value);
                    setPCategoryId(nextCategoryId);
                    setPSubcategoryId(0);
                  }}
                >
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Subcategory</label>
                <select
                  className="w-full rounded-md border px-3 py-2"
                  value={String(pSubcategoryId)}
                  onChange={(e) => setPSubcategoryId(Number(e.target.value))}
                  disabled={!filteredSubcategories.length}
                >
                  <option value="0">{filteredSubcategories.length ? 'Select subcategory' : 'No subcategories available'}</option>
                  {filteredSubcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Brand</label>
                <select className="w-full rounded-md border px-3 py-2" value={String(pBrandId || 0)} onChange={(e) => setPBrandId(Number(e.target.value))}>
                  <option value="0">None</option>
                  {brands?.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Meta Title</label>
                <Input value={pMetaTitle} onChange={(e) => setPMetaTitle(e.target.value)} placeholder="SEO Title" />
              </div>
              <div className="md:col-span-3">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Meta Description</label>
                <Input value={pMetaDescription} onChange={(e) => setPMetaDescription(e.target.value)} placeholder="SEO Description" />
              </div>
              <div className="md:col-span-6">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Description</label>
                <textarea
                  className="w-full rounded-md border px-3 py-2 text-sm min-h-[120px] resize-y"
                  value={pDescription}
                  onChange={(e) => setPDescription(e.target.value)}
                  placeholder="Full product description..."
                />
              </div>
              <div className="md:col-span-3">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Warranty</label>
                <Input value={pWarrantyText} onChange={(e) => setPWarrantyText(e.target.value)} placeholder="e.g. 1 year manufacturer warranty" />
              </div>
              <div className="md:col-span-2 flex items-end gap-2">
                <Button type="submit">Save</Button>
                <Button type="button" variant="outline" onClick={() => {
                  setPName(product.name);
                  setPSlug(product.slug);
                  setPSku(product.sku ?? '');
                  setPPrice(String(product.price ?? ''));
                  setPStock(String(product.stock ?? '0'));
                  setPLowStock(String(product.low_stock_threshold ?? '10'));
                  setPDiscount(initialDiscount);
                  setPThumb(product.feature_image ?? '');
                  setPStoreId(product.store_id ?? stores?.[0]?.id ?? 0);
                  setPCategoryId(product.category_id ?? categories?.[0]?.id ?? 0);
                  setPSubcategoryId(product.subcategory_id ?? 0);
                  setPBrandId(product.brand_id ?? 0);
                  setPMetaTitle(product.meta_title ?? '');
                  setPMetaDescription(product.meta_description ?? '');
                  setPDescription(product.description ?? '');
                  setPWarrantyText(product.warranty_text ?? '');
                }}>Reset</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-2xl">🖼️</span>
              Product Gallery
            </CardTitle>
            <CardDescription>Upload multiple images or paste existing paths</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-6 rounded-lg border-2 border-dashed p-4 bg-muted/20">
              <h4 className="text-sm font-semibold mb-3">Add Gallery Image</h4>
              <form onSubmit={addImage} className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Image Path</label>
                  <Input value={imgPath} onChange={(e) => setImgPath(e.target.value)} placeholder="/images/path.png" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Or Upload File</label>
                  <Input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.svg"
                    onChange={(e) => setGalleryFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full">Add Image</Button>
                </div>
              </form>
              {galleryPreview && (
                <div className="mt-4 p-3 bg-background rounded-md border">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Preview</div>
                  <img src={galleryPreview} alt="" className="h-32 w-32 rounded-md border-2 object-cover" />
                </div>
              )}
            </div>
            
            {product.images && product.images.length > 0 ? (
              <div className="rounded-lg border">
                <div className="hidden md:block w-full overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-16">ID</TableHead>
                      <TableHead className="w-32">Preview</TableHead>
                      <TableHead className="hidden md:table-cell">Path</TableHead>
                      <TableHead className="w-24">Primary</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.images.map((img) => (
                      <TableRow key={img.id} className={img.is_primary ? 'bg-primary/5' : ''}>
                        <TableCell className="font-medium">{img.id}</TableCell>
                        <TableCell>
                          <img src={img.path} alt="" className="h-16 w-16 rounded-md border-2 object-cover shadow-sm" />
                        </TableCell>
                        <TableCell className="font-mono text-xs hidden md:table-cell">{img.path}</TableCell>
                        <TableCell>
                          {img.is_primary ? (
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                              Primary
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!img.is_primary && (
                              <Button size="sm" variant="outline" onClick={async () => {
                                const res = await patchJson(`/api/admin/products/${product.id}/images/${img.id}/primary`, {});
                                if (res.ok) router.reload({ only: ['product'] });
                              }}>Set Primary</Button>
                            )}
                            <Button size="sm" variant="destructive" onClick={() => deleteImage(img.id)}>Delete</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
                <div className="md:hidden grid gap-2 p-3">
                  {product.images.map((img) => (
                    <div key={img.id} className="rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <img src={img.path} alt="" className="h-16 w-16 rounded-md border-2 object-cover shadow-sm" />
                        <div className="text-xs text-muted-foreground">{img.is_primary ? 'Primary' : '—'}</div>
                      </div>
                      <div className="mt-2 flex justify-end gap-2">
                        {!img.is_primary && (
                          <Button size="sm" variant="outline" onClick={async () => {
                            const res = await patchJson(`/api/admin/products/${product.id}/images/${img.id}/primary`, {});
                            if (res.ok) router.reload({ only: ['product'] });
                          }}>Set Primary</Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => deleteImage(img.id)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No gallery images yet. Add one above to get started.
              </div>
            )}
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
