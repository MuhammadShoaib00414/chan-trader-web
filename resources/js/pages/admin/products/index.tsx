import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ToastStack } from '@/components/ui/toast-stack';
import AppLayout from '@/layouts/app-layout';
import { delJson, postForm, postJson } from '@/lib/http';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

export default function ProductsIndex() {
    type ProductItem = {
        id: number;
        name: string;
        slug: string;
        sku: string;
        price: number;
        purchase_price?: number | null;
        stock?: number;
        low_stock_threshold?: number;
        compare_at?: number | null;
        discount_percent?: number | null;
        has_primary_image?: boolean;
        thumb?: string;
        store?: { id: number; name: string } | null;
        category?: { id: number; name: string } | null;
        is_published?: boolean;
    };
    type CategoryRef = { id: number; name: string };
    type SubcategoryRef = { id: number; name: string; category_id: number };
    type StoreRef = { id: number; name: string };
    type BrandRef = { id: number; name: string };
    type Pagination = {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
    const { props } = usePage<{
        items: any;
        categories: CategoryRef[];
        subcategories: SubcategoryRef[];
        stores: StoreRef[];
        brands: BrandRef[];
        pagination?: Pagination;
        filters?: {
            q?: string;
            category_id?: string;
            store_id?: string;
            sort_by?: string;
            sort_dir?: string;
        };
        isVendor?: boolean;
        vendorStore?: StoreRef | null;
    }>();
    const rawItems = props.items;
    const items: ProductItem[] = Array.isArray(rawItems)
        ? rawItems
        : Array.isArray((rawItems as any)?.data)
          ? (rawItems as any).data
          : [];
    const categories = props.categories;
    const subcategories = props.subcategories ?? [];
    const stores = props.stores;
    const brands = props.brands ?? [];
    const pagination = props.pagination;
    const filters = props.filters ?? {};
    const isVendor = props.isVendor ?? false;
    const vendorStore = props.vendorStore ?? null;

    const [storeId, setStoreId] = useState<number>(
        isVendor ? (vendorStore?.id ?? 0) : (stores?.[0]?.id ?? 0),
    );
    const [categoryId, setCategoryId] = useState<number>(
        categories?.[0]?.id ?? 0,
    );
    const [subcategoryId, setSubcategoryId] = useState<number>(0);
    const [brandId, setBrandId] = useState<number>(brands?.[0]?.id ?? 0);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [sku, setSku] = useState('');
    const [price, setPrice] = useState('');
    const [purchasePrice, setPurchasePrice] = useState('');
    const [stock, setStock] = useState('');
    const [lowStockThreshold, setLowStockThreshold] = useState('10');
    const [compareAt, setCompareAt] = useState('');
    const [description, setDescription] = useState('');
    const [warrantyText, setWarrantyText] = useState('');
    const [featureImage, setFeatureImage] = useState<File | null>(null);
    const [subcategoryOptions, setSubcategoryOptions] = useState<
        SubcategoryRef[]
    >(() =>
        subcategories.filter(
            (subcategory) =>
                subcategory.category_id === (categories?.[0]?.id ?? 0),
        ),
    );
    const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
    const [toasts, setToasts] = useState<
        Array<{ id: number; title: string; variant: 'success' | 'error' }>
    >([]);
    const [addOpen, setAddOpen] = useState(false);

    const filteredSubcategories = useMemo(
        () =>
            subcategoryOptions.filter(
                (subcategory) => subcategory.category_id === categoryId,
            ),
        [categoryId, subcategoryOptions],
    );
    const categoryOptions = useMemo(
        () =>
            categories.map((category) => ({
                label: category.name,
                value: category.id,
            })),
        [categories],
    );

    useEffect(() => {
        if (!categoryId) {
            setSubcategoryOptions([]);
            setSubcategoryId(0);
            return;
        }

        const controller = new AbortController();
        let isActive = true;

        const loadSubcategories = async () => {
            setSubcategoriesLoading(true);

            try {
                const res = await fetch(
                    `/api/admin/products/subcategories?category_id=${categoryId}`,
                    {
                        credentials: 'same-origin',
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        signal: controller.signal,
                    },
                );

                if (!res.ok) {
                    throw new Error(
                        `Failed to load subcategories (${res.status})`,
                    );
                }

                const data = (await res.json()) as { data?: SubcategoryRef[] };

                if (isActive) {
                    setSubcategoryOptions(
                        Array.isArray(data?.data)
                            ? data.data
                            : subcategories.filter(
                                  (subcategory) =>
                                      subcategory.category_id === categoryId,
                              ),
                    );
                }
            } catch (error) {
                if (controller.signal.aborted) {
                    return;
                }

                if (isActive) {
                    setSubcategoryOptions(
                        subcategories.filter(
                            (subcategory) =>
                                subcategory.category_id === categoryId,
                        ),
                    );
                    showToast(
                        'Unable to load subcategories for the selected category.',
                        'error',
                    );
                }
            } finally {
                if (isActive && !controller.signal.aborted) {
                    setSubcategoriesLoading(false);
                }
            }
        };

        void loadSubcategories();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, [categoryId, subcategories]);

    useEffect(() => {
        if (
            subcategoryId &&
            !filteredSubcategories.some(
                (subcategory) => subcategory.id === subcategoryId,
            )
        ) {
            setSubcategoryId(0);
        }
    }, [filteredSubcategories, subcategoryId]);

    const dismissToast = (id: number) =>
        setToasts((ts) => ts.filter((t) => t.id !== id));
    const showToast = (
        title: string,
        variant: 'success' | 'error' = 'success',
    ) => {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        setToasts((ts) => [...ts, { id, title, variant }]);
        setTimeout(() => dismissToast(id), 2500);
    };

    const errorMessageFromResponse = async (res: Response): Promise<string> => {
        try {
            const data = (await res.json()) as any;
            if (data?.message && typeof data.message === 'string')
                return data.message;
            const firstError = data?.errors
                ? Object.values<any>(data.errors)?.flat()?.[0]
                : null;
            if (firstError && typeof firstError === 'string') return firstError;
            return `Request failed (${res.status}).`;
        } catch {
            return `Request failed (${res.status}).`;
        }
    };

    const slugify = (s: string) =>
        s
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');

    const submitFilters = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const data = new FormData(form);
        const q = String(data.get('q') || '');
        const category_id = String(data.get('category_id') || '');
        const store_id = String(data.get('store_id') || '');
        const sort_by = String(data.get('sort_by') || '');
        const sort_dir = String(data.get('sort_dir') || '');
        router.get(
            '/admin/products',
            {
                q: q || undefined,
                category_id: category_id || undefined,
                store_id: store_id || undefined,
                sort_by: sort_by || undefined,
                sort_dir: sort_dir || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['items', 'pagination', 'filters'],
            },
        );
    };
    const goto = (page: number) => {
        router.get(
            '/admin/products',
            { ...filters, page },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['items', 'pagination'],
            },
        );
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const fd = new FormData();
        const effectiveStoreId = isVendor
            ? (vendorStore?.id ?? storeId)
            : storeId;
        fd.append('store_id', String(effectiveStoreId));
        fd.append('category_id', String(categoryId));
        if (subcategoryId) fd.append('subcategory_id', String(subcategoryId));
        if (brandId) fd.append('brand_id', String(brandId));
        fd.append('name', name);
        fd.append('slug', slug);
        fd.append('sku', sku);
        fd.append('price', String(price));
        if (purchasePrice) fd.append('purchase_price', String(purchasePrice));
        if (stock) fd.append('stock', String(stock));
        if (lowStockThreshold)
            fd.append('low_stock_threshold', String(lowStockThreshold));
        if (compareAt) fd.append('compare_at', String(compareAt));
        if (description) fd.append('description', description);
        if (warrantyText) fd.append('warranty_text', warrantyText);
        if (featureImage) fd.append('feature_image', featureImage);

        const res = await postForm('/api/admin/products', fd);
        if (res.ok) {
            setName('');
            setSlug('');
            setSku('');
            setPrice('');
            setPurchasePrice('');
            setStock('');
            setLowStockThreshold('10');
            setCompareAt('');
            setSubcategoryId(0);
            setDescription('');
            setWarrantyText('');
            setFeatureImage(null);
            showToast('Product created.', 'success');
            setAddOpen(false);
            router.reload({ only: ['items'] });
            return;
        }
        showToast(await errorMessageFromResponse(res), 'error');
    };

    const deleteProduct = async (productId: number) => {
        if (
            !confirm(
                'Are you sure you want to delete this product? This action cannot be undone.',
            )
        ) {
            return;
        }

        const res = await delJson(`/api/admin/products/${productId}`);
        if (res.ok) {
            showToast('Product deleted successfully.', 'success');
            router.reload({ only: ['items'] });
        } else {
            showToast(await errorMessageFromResponse(res), 'error');
        }
    };

    const togglePublishedStatus = async (
        productId: number,
        currentStatus: boolean,
    ) => {
        const endpoint = currentStatus
            ? `/api/admin/products/${productId}/unpublish`
            : `/api/admin/products/${productId}/publish`;

        const action = currentStatus ? 'unpublish' : 'publish';

        const res = await postJson(endpoint, {});
        if (res.ok) {
            showToast(`Product ${action}ed successfully.`, 'success');
            router.reload({ only: ['items'] });
        } else {
            showToast(await errorMessageFromResponse(res), 'error');
        }
    };

    return (
        <AppLayout
            breadcrumbs={[{ title: 'Products', href: '/admin/products' }]}
        >
            <Head title="Products" />
            <div className="grid gap-6 p-4">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold">Products</h2>
                        <Button onClick={() => setAddOpen(true)}>
                            Add Product
                        </Button>
                    </div>

                    <form
                        onSubmit={submitFilters}
                        className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6"
                    >
                        <div className="col-span-2 sm:col-span-3 md:col-span-2">
                            <label className="mb-1 block text-sm">
                                Search (name or SKU)
                            </label>
                            <Input
                                name="q"
                                defaultValue={filters.q ?? ''}
                                placeholder="MOSFET or SKU-0001"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm">Store</label>
                            <select
                                className="w-full rounded-md border px-2 py-2"
                                name="store_id"
                                defaultValue={filters.store_id ?? ''}
                            >
                                <option value="">All</option>
                                {stores?.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm">
                                Category
                            </label>
                            <select
                                className="w-full rounded-md border px-2 py-2"
                                name="category_id"
                                defaultValue={filters.category_id ?? ''}
                            >
                                <option value="">All</option>
                                {categories?.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm">
                                Sort By
                            </label>
                            <select
                                className="w-full rounded-md border px-2 py-2"
                                name="sort_by"
                                defaultValue={filters.sort_by ?? 'created_at'}
                            >
                                <option value="created_at">Created</option>
                                <option value="price">Price</option>
                                <option value="name">Name</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm">
                                Direction
                            </label>
                            <select
                                className="w-full rounded-md border px-2 py-2"
                                name="sort_dir"
                                defaultValue={filters.sort_dir ?? 'desc'}
                            >
                                <option value="desc">Desc</option>
                                <option value="asc">Asc</option>
                            </select>
                        </div>
                        <div className="col-span-2 flex items-end sm:col-span-1">
                            <Button type="submit" className="w-full sm:w-auto">
                                Filter
                            </Button>
                        </div>
                    </form>

                    <Dialog open={addOpen} onOpenChange={setAddOpen}>
                        <DialogContent className="max-h-[90vh] !max-w-5xl overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add Product</DialogTitle>
                            </DialogHeader>
                            <form
                                onSubmit={(e) => {
                                    void submit(e);
                                }}
                                className="grid grid-cols-1 gap-4 md:grid-cols-2"
                            >
                                <div className="md:col-span-2">
                                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                                        Basic Information
                                    </h3>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Name *
                                    </label>
                                    <Input
                                        value={name}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setName(v);
                                            if (!slug || slug === slugify(name))
                                                setSlug(slugify(v));
                                        }}
                                        placeholder="MOSFET XYZ"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">
                                        SKU *
                                    </label>
                                    <Input
                                        value={sku}
                                        onChange={(e) => setSku(e.target.value)}
                                        placeholder="SKU-0001"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Slug *
                                    </label>
                                    <Input
                                        value={slug}
                                        onChange={(e) =>
                                            setSlug(e.target.value)
                                        }
                                        placeholder="mosfet-xyz"
                                        required
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Auto-generated from name
                                    </p>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Price *
                                    </label>
                                    <Input
                                        value={price}
                                        onChange={(e) =>
                                            setPrice(e.target.value)
                                        }
                                        placeholder="10.00"
                                        type="number"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Cost price
                                    </label>
                                    <Input
                                        value={purchasePrice}
                                        onChange={(e) =>
                                            setPurchasePrice(e.target.value)
                                        }
                                        placeholder="8.00"
                                        type="number"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Opening stock
                                    </label>
                                    <Input
                                        value={stock}
                                        onChange={(e) =>
                                            setStock(e.target.value)
                                        }
                                        placeholder="0"
                                        type="number"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Low stock alert
                                    </label>
                                    <Input
                                        value={lowStockThreshold}
                                        onChange={(e) =>
                                            setLowStockThreshold(
                                                e.target.value,
                                            )
                                        }
                                        placeholder="10"
                                        type="number"
                                        min="0"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Compare at price (optional)
                                    </label>
                                    <Input
                                        value={compareAt}
                                        onChange={(e) =>
                                            setCompareAt(e.target.value)
                                        }
                                        placeholder="12.00"
                                        type="number"
                                        step="0.01"
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Show original price for discounts
                                    </p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Description (optional)
                                    </label>
                                    <textarea
                                        className="min-h-[100px] w-full resize-y rounded-md border px-3 py-2 text-sm"
                                        value={description}
                                        onChange={(e) =>
                                            setDescription(e.target.value)
                                        }
                                        placeholder="Full product description..."
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Warranty (optional)
                                    </label>
                                    <Input
                                        value={warrantyText}
                                        onChange={(e) =>
                                            setWarrantyText(e.target.value)
                                        }
                                        placeholder="e.g. 1 year manufacturer warranty"
                                    />
                                </div>

                                <div className="border-t pt-4 md:col-span-2">
                                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                                        Organization
                                    </h3>
                                </div>
                                {!isVendor && (
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium">
                                            Store *
                                        </label>
                                        <select
                                            className="w-full rounded-md border px-3 py-2"
                                            value={String(storeId)}
                                            onChange={(e) =>
                                                setStoreId(
                                                    Number(e.target.value),
                                                )
                                            }
                                        >
                                            {stores?.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {isVendor && vendorStore && (
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium">
                                            Store
                                        </label>
                                        <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                                            {vendorStore.name}
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Category *
                                    </label>
                                    <SearchableSelect
                                        options={categoryOptions}
                                        searchPlaceholder="Search categories..."
                                        value={categoryId}
                                        onChange={(nextValue) => {
                                            const nextCategoryId = Number(
                                                nextValue ?? 0,
                                            );
                                            setCategoryId(nextCategoryId);
                                            setSubcategoryId(0);
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Subcategory (optional)
                                    </label>
                                     <span className="text-[11px] text-muted-foreground">
                                        {subcategoriesLoading
                                            ? 'Loading...'
                                            : `${filteredSubcategories.length} available`}
                                    </span>
                                    <select
                                        className="w-full rounded-md border px-3 py-2"
                                        value={String(subcategoryId)}
                                        onChange={(e) =>
                                            setSubcategoryId(
                                                Number(e.target.value),
                                            )
                                        }
                                        disabled={
                                            subcategoriesLoading ||
                                            !filteredSubcategories.length
                                        }
                                    >
                                        <option value={0}>
                                            {subcategoriesLoading
                                                ? 'Loading subcategories...'
                                                : filteredSubcategories.length
                                                  ? 'Select subcategory'
                                                  : 'No subcategories available'}
                                        </option>
                                        {filteredSubcategories.map(
                                            (subcategory) => (
                                                <option
                                                    key={subcategory.id}
                                                    value={subcategory.id}
                                                >
                                                    {subcategory.name}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Subcategories are loaded from the API
                                        after category selection.
                                    </p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Brand (optional)
                                    </label>
                                    <select
                                        className="w-full rounded-md border px-3 py-2"
                                        value={String(brandId)}
                                        onChange={(e) =>
                                            setBrandId(Number(e.target.value))
                                        }
                                    >
                                        <option value={0}>None</option>
                                        {brands?.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="border-t pt-4 md:col-span-2">
                                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                                        Media
                                    </h3>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Feature image (optional)
                                    </label>
                                    <Input
                                        type="file"
                                        accept=".png,.jpg,.jpeg,.webp"
                                        onChange={(e) =>
                                            setFeatureImage(
                                                e.target.files?.[0] ?? null,
                                            )
                                        }
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Main product image displayed in listings
                                    </p>
                                </div>
                                <DialogFooter className="md:col-span-2">
                                    <Button type="submit">Save</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="rounded-lg border">
                    <div className="hidden w-full overflow-x-auto md:block">
                        <Table className="min-w-[900px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">ID</TableHead>
                                    <TableHead className="whitespace-nowrap">
                                        Name
                                    </TableHead>
                                    <TableHead className="hidden md:table-cell">
                                        Slug
                                    </TableHead>
                                    <TableHead className="whitespace-nowrap">
                                        SKU
                                    </TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead className="hidden lg:table-cell">
                                        Cost
                                    </TableHead>
                                    <TableHead className="hidden sm:table-cell">
                                        Discount
                                    </TableHead>
                                    <TableHead className="hidden lg:table-cell">
                                        Thumb
                                    </TableHead>
                                    <TableHead className="hidden md:table-cell">
                                        Store
                                    </TableHead>
                                    <TableHead className="hidden md:table-cell">
                                        Category
                                    </TableHead>
                                    <TableHead className="hidden sm:table-cell">
                                        Status
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items?.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell>{p.id}</TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {p.name}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {p.slug}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {p.sku}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm">
                                                <span>{p.stock ?? 0}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    alert {p.low_stock_threshold ?? 0}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm">
                                                <span>Rs {p.price}</span>
                                                {p.compare_at &&
                                                    p.compare_at > p.price && (
                                                        <span className="text-xs text-muted-foreground line-through">
                                                            Rs {p.compare_at}
                                                        </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            {p.purchase_price != null
                                                ? `Rs ${p.purchase_price}`
                                                : '-'}
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            {p.discount_percent &&
                                            p.discount_percent > 0 ? (
                                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                                                    -{p.discount_percent}%
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            {p.thumb ? (
                                                <img
                                                    src={p.thumb}
                                                    alt=""
                                                    className="h-8 w-8 rounded object-cover"
                                                />
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                        <TableCell className="hidden text-xs md:table-cell">
                                            {p.store?.name ?? '-'}
                                        </TableCell>
                                        <TableCell className="hidden text-xs md:table-cell">
                                            {p.category?.name ?? '-'}
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            {p.is_published ? (
                                                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                                                    Published
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700">
                                                    Draft
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    asChild
                                                >
                                                    <a
                                                        href={`/admin/products/${p.id}`}
                                                    >
                                                        Manage
                                                    </a>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={
                                                        p.is_published
                                                            ? 'secondary'
                                                            : 'default'
                                                    }
                                                    onClick={() =>
                                                        togglePublishedStatus(
                                                            p.id,
                                                            p.is_published ??
                                                                false,
                                                        )
                                                    }
                                                >
                                                    {p.is_published
                                                        ? 'Unpublish'
                                                        : 'Publish'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        deleteProduct(p.id)
                                                    }
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="grid gap-2 p-3 md:hidden">
                        {items?.map((p) => {
                            const price = `Rs ${p.price}`;
                            const compare =
                                p.compare_at && p.compare_at > p.price
                                    ? `Rs ${p.compare_at}`
                                    : '';
                            return (
                                <div
                                    key={p.id}
                                    className="rounded-lg border p-3"
                                >
                                    <div className="font-medium">{p.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {p.sku}
                                    </div>
                                    <div className="mt-1 text-sm">
                                        <span>{price}</span>
                                        {compare ? (
                                            <span className="ml-2 text-xs text-muted-foreground line-through">
                                                {compare}
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="mt-1 text-xs text-muted-foreground">
                                        Stock: {p.stock ?? 0} • Alert:{' '}
                                        {p.low_stock_threshold ?? 0}
                                    </div>
                                    <div className="mt-1 flex flex-col gap-1 text-xs text-muted-foreground">
                                        {p.store?.name && (
                                            <div>
                                                <span className="font-medium">
                                                    Store:
                                                </span>{' '}
                                                {p.store.name}
                                            </div>
                                        )}
                                        {p.category?.name && (
                                            <div>
                                                <span className="font-medium">
                                                    Category:
                                                </span>{' '}
                                                {p.category.name}
                                            </div>
                                        )}
                                        <div>
                                            <span className="font-medium">
                                                Status:
                                            </span>{' '}
                                            {p.is_published ? (
                                                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                                                    Published
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700">
                                                    Draft
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-2 flex flex-col gap-1">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                asChild
                                            >
                                                <a
                                                    href={`/admin/products/${p.id}`}
                                                >
                                                    Manage
                                                </a>
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={
                                                    p.is_published
                                                        ? 'secondary'
                                                        : 'default'
                                                }
                                                onClick={() =>
                                                    togglePublishedStatus(
                                                        p.id,
                                                        p.is_published ?? false,
                                                    )
                                                }
                                            >
                                                {p.is_published
                                                    ? 'Unpublish'
                                                    : 'Publish'}
                                            </Button>
                                        </div>
                                        <div className="flex justify-end">
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() =>
                                                    deleteProduct(p.id)
                                                }
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                {pagination && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            Page {pagination.current_page} of{' '}
                            {pagination.last_page} • Total {pagination.total}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={pagination.current_page <= 1}
                                onClick={() =>
                                    goto(pagination.current_page - 1)
                                }
                            >
                                Prev
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={
                                    pagination.current_page >=
                                    pagination.last_page
                                }
                                onClick={() =>
                                    goto(pagination.current_page + 1)
                                }
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            <ToastStack toasts={toasts} onDismiss={dismissToast} />
        </AppLayout>
    );
}
