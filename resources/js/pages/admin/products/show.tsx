import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ToastStack } from '@/components/ui/toast-stack';
import AppLayout from '@/layouts/app-layout';
import { delJson, patchJson, postForm, postJson } from '@/lib/http';
import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Boxes,
    FileSearch,
    FolderTree,
    ImageIcon,
    Layers3,
    LoaderCircle,
    Package2,
    Percent,
    Save,
    ScanLine,
    Shield,
    Tag,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const VISIBILITY_OPTIONS = [
    { value: 'website_only', label: 'Website Only' },
    { value: 'mobile_app_only', label: 'Mobile App Only' },
    { value: 'website_and_mobile', label: 'Website & Mobile App' },
    { value: 'hidden', label: 'Hidden (Do Not Show)' },
] as const;

export default function ProductShow() {
    type Image = { id: number; path: string; is_primary: boolean };
    type ProductDetails = {
        id: number;
        name: string;
        article?: string | null;
        deal_name?: string | null;
        limited_discount_text?: string | null;
        slug: string;
        sku: string;
        price: number;
        discount_percent?: number | null;
        purchase_price?: number | null;
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
        visibility?: string | null;
        images: Image[];
    };
    type Ref = { id: number; name: string };
    type SubcategoryRef = { id: number; name: string; category_id: number };
    type ArticleRef = {
        id: number;
        name: string;
        slug: string;
        subcategory_id: number;
    };

    const { props } = usePage<{
        product: ProductDetails;
        stores: Ref[];
        categories: Ref[];
        subcategories: SubcategoryRef[];
        brands: Ref[];
    }>();
    const product = props.product;
    const stores = props.stores ?? [];
    const categories = props.categories ?? [];
    const subcategories = props.subcategories ?? [];
    const brands = props.brands ?? [];

    const [imgPath, setImgPath] = useState('');
    const [galleryFile, setGalleryFile] = useState<File | null>(null);
    const galleryPreview = useMemo(
        () => (galleryFile ? URL.createObjectURL(galleryFile) : ''),
        [galleryFile],
    );
    const [featureFile, setFeatureFile] = useState<File | null>(null);
    const [topFile, setTopFile] = useState<File | null>(null);
    const featurePreview = useMemo(
        () => (featureFile ? URL.createObjectURL(featureFile) : ''),
        [featureFile],
    );
    const topPreview = useMemo(
        () => (topFile ? URL.createObjectURL(topFile) : ''),
        [topFile],
    );

    const [toasts, setToasts] = useState<
        Array<{ id: number; title: string; variant: 'success' | 'error' }>
    >([]);
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

    const initialDiscount = useMemo(() => {
        if (product.discount_percent && product.discount_percent > 0) {
            return String(product.discount_percent);
        }

        const c = product.compare_at ?? null;
        const p = product.price ?? 0;
        if (c && c > p && c > 0) {
            return String(Math.round(((c - p) / c) * 100));
        }
        return '';
    }, [product.compare_at, product.discount_percent, product.price]);

    const [pName, setPName] = useState(product.name);
    const [pArticle, setPArticle] = useState(product.article ?? '');
    const [pDealName, setPDealName] = useState(product.deal_name ?? '');
    const [pLimitedDiscountText, setPLimitedDiscountText] = useState(
        product.limited_discount_text ?? '',
    );
    const [pSlug, setPSlug] = useState(product.slug);
    const [pSku, setPSku] = useState(product.sku ?? '');
    const [pPrice, setPPrice] = useState(String(product.price ?? ''));
    const [pPurchasePrice, setPPurchasePrice] = useState(
        String(product.purchase_price ?? '0'),
    );
    const [pStock, setPStock] = useState(String(product.stock ?? '0'));
    const [pLowStock, setPLowStock] = useState(
        String(product.low_stock_threshold ?? '10'),
    );
    const [pDiscount, setPDiscount] = useState(initialDiscount);
    const [pThumb, setPThumb] = useState(product.feature_image ?? '');
    const [pStoreId, setPStoreId] = useState<number>(
        product.store_id ?? stores?.[0]?.id ?? 0,
    );
    const [pCategoryId, setPCategoryId] = useState<number>(
        product.category_id ?? categories?.[0]?.id ?? 0,
    );
    const [pSubcategoryId, setPSubcategoryId] = useState<number>(
        product.subcategory_id ?? 0,
    );
    const [pBrandId, setPBrandId] = useState<number>(product.brand_id ?? 0);
    const [pVisibility, setPVisibility] = useState(
        product.visibility ?? 'website_and_mobile',
    );
    const [pMetaTitle, setPMetaTitle] = useState(product.meta_title ?? '');
    const [pMetaDescription, setPMetaDescription] = useState(
        product.meta_description ?? '',
    );
    const [pDescription, setPDescription] = useState(product.description ?? '');
    const [pWarrantyText, setPWarrantyText] = useState(
        product.warranty_text ?? '',
    );
    const [subcategoryOptions, setSubcategoryOptions] = useState<
        SubcategoryRef[]
    >(() =>
        subcategories.filter(
            (subcategory) =>
                subcategory.category_id ===
                (product.category_id ?? categories?.[0]?.id ?? 0),
        ),
    );
    const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
    const [articleOptions, setArticleOptions] = useState<ArticleRef[]>([]);
    const [articlesLoading, setArticlesLoading] = useState(false);
    const [savingBasics, setSavingBasics] = useState(false);
    const [uploadingGallery, setUploadingGallery] = useState(false);
    const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
    const [settingPrimaryId, setSettingPrimaryId] = useState<number | null>(
        null,
    );
    const [uploadingFeatureImage, setUploadingFeatureImage] = useState(false);
    const [uploadingTopImage, setUploadingTopImage] = useState(false);
    const [deletingProduct, setDeletingProduct] = useState(false);
    const [selectedPreviewImage, setSelectedPreviewImage] = useState('');

    const slugify = (s: string) =>
        s
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');

    type UpdatePayload = {
        name?: string;
        deal_name?: string | null;
        limited_discount_text?: string | null;
        article?: string | null;
        slug?: string;
        sku?: string | null;
        feature_image?: string | null;
        store_id?: number;
        category_id?: number;
        subcategory_id?: number | null;
        brand_id?: number | null;
        price?: number;
        purchase_price?: number;
        stock?: number;
        low_stock_threshold?: number;
        discount_percent?: number | null;
        compare_at?: number | null;
        meta_title?: string | null;
        meta_description?: string | null;
        description?: string | null;
        warranty_text?: string | null;
        visibility?: string;
    };

    const filteredSubcategories = useMemo(
        () =>
            subcategoryOptions.filter(
                (subcategory) => subcategory.category_id === pCategoryId,
            ),
        [pCategoryId, subcategoryOptions],
    );

    useEffect(() => {
        if (!pCategoryId) {
            setSubcategoryOptions([]);
            setPSubcategoryId(0);
            return;
        }

        const controller = new AbortController();
        let isActive = true;

        const loadSubcategories = async () => {
            setSubcategoriesLoading(true);

            try {
                const res = await fetch(
                    `/api/admin/products/subcategories?category_id=${pCategoryId}`,
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
                        Array.isArray(data?.data) ? data.data : [],
                    );
                }
            } catch (error) {
                if (controller.signal.aborted) {
                    return;
                }

                if (isActive) {
                    setSubcategoryOptions([]);
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
    }, [pCategoryId]);

    useEffect(() => {
        if (
            pSubcategoryId &&
            !filteredSubcategories.some(
                (subcategory) => subcategory.id === pSubcategoryId,
            )
        ) {
            setPSubcategoryId(0);
        }
    }, [filteredSubcategories, pSubcategoryId]);

    useEffect(() => {
        if (!pSubcategoryId) {
            setArticleOptions([]);
            setPArticle('');
            return;
        }

        const controller = new AbortController();
        let isActive = true;

        const loadArticles = async () => {
            setArticlesLoading(true);

            try {
                const res = await fetch(
                    `/api/admin/products/articles?subcategory_id=${pSubcategoryId}`,
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
                    throw new Error(`Failed to load articles (${res.status})`);
                }

                const data = (await res.json()) as { data?: ArticleRef[] };

                if (isActive) {
                    setArticleOptions(Array.isArray(data?.data) ? data.data : []);
                }
            } catch (error) {
                if (controller.signal.aborted) {
                    return;
                }

                if (isActive) {
                    setArticleOptions([]);
                    showToast(
                        'Unable to load articles for the selected subcategory.',
                        'error',
                    );
                }
            } finally {
                if (isActive && !controller.signal.aborted) {
                    setArticlesLoading(false);
                }
            }
        };

        void loadArticles();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, [pSubcategoryId]);

    useEffect(() => {
        if (
            pArticle &&
            articleOptions.length > 0 &&
            !articleOptions.some((option) => option.name === pArticle)
        ) {
            setPArticle('');
        }
    }, [articleOptions, pArticle]);

    const saveBasics = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingBasics(true);
        const payload: UpdatePayload = {};
        if (pName) payload.name = pName;
        payload.article = pArticle || null;
        payload.deal_name = pDealName || null;
        payload.limited_discount_text = pLimitedDiscountText || null;
        if (pSlug) payload.slug = pSlug;
        if (pSku) payload.sku = pSku;
        if (pThumb || pThumb === '') payload.feature_image = pThumb || null;
        if (pStoreId) payload.store_id = pStoreId;
        if (pCategoryId) payload.category_id = pCategoryId;
        payload.subcategory_id = pSubcategoryId || null;
        if (pBrandId) payload.brand_id = pBrandId;
        if (pMetaTitle || pMetaTitle === '')
            payload.meta_title = pMetaTitle || null;
        if (pMetaDescription || pMetaDescription === '')
            payload.meta_description = pMetaDescription || null;
        payload.description = pDescription || null;
        payload.warranty_text = pWarrantyText || null;
        payload.visibility = pVisibility;
        if (pStock) payload.stock = Number(pStock);
        if (pLowStock) payload.low_stock_threshold = Number(pLowStock);
        if (pPrice) {
            const priceVal = Number(pPrice);
            if (!Number.isNaN(priceVal)) payload.price = priceVal;
            if (pDiscount) {
                const d = Number(pDiscount);
                if (!Number.isNaN(d) && d > 0 && d < 100 && priceVal > 0) {
                    payload.discount_percent = d;
                } else {
                    payload.discount_percent = null;
                    payload.compare_at = null;
                }
            } else {
                payload.discount_percent = null;
                payload.compare_at = null;
            }
        }
        if (pPurchasePrice) {
            const purchasePriceVal = Number(pPurchasePrice);
            if (!Number.isNaN(purchasePriceVal))
                payload.purchase_price = purchasePriceVal;
        }
        try {
            const res = await patchJson(
                `/api/admin/products/${product.id}`,
                payload,
            );
            if (res.ok) {
                router.reload({ only: ['product'] });
                showToast('Product updated.', 'success');
            } else {
                showToast(await errorMessageFromResponse(res), 'error');
            }
        } finally {
            setSavingBasics(false);
        }
    };

    const addImage = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploadingGallery(true);
        let res;
        try {
            if (imgPath) {
                res = await postJson(`/api/admin/products/${product.id}/images`, {
                    path: imgPath,
                });
            } else {
                if (!galleryFile) return;
                const form = new FormData();
                form.append('file', galleryFile);
                res = await postForm(
                    `/api/admin/products/${product.id}/images`,
                    form,
                );
            }
            if (res.ok) {
                setImgPath('');
                setGalleryFile(null);
                router.reload({ only: ['product'] });
                showToast('Gallery image uploaded.', 'success');
            } else {
                showToast(await errorMessageFromResponse(res), 'error');
            }
        } finally {
            setUploadingGallery(false);
        }
    };

    const deleteImage = async (imgId: number) => {
        if (!window.confirm('Delete this gallery image?')) {
            return;
        }
        setDeletingImageId(imgId);

        try {
            const res = await delJson(
                `/api/admin/products/${product.id}/images/${imgId}`,
            );
            if (res.ok) {
                router.reload({ only: ['product'] });
                showToast('Gallery image deleted.', 'success');
            } else {
                showToast(await errorMessageFromResponse(res), 'error');
            }
        } finally {
            setDeletingImageId(null);
        }
    };

    const setPrimaryImage = async (imgId: number) => {
        setSettingPrimaryId(imgId);

        try {
            const res = await patchJson(
                `/api/admin/products/${product.id}/images/${imgId}/primary`,
                {},
            );
            if (res.ok) {
                router.reload({ only: ['product'] });
                showToast('Primary image updated.', 'success');
            } else {
                showToast(await errorMessageFromResponse(res), 'error');
            }
        } finally {
            setSettingPrimaryId(null);
        }
    };

    const uploadFeatureImage = async () => {
        if (!featureFile) return;
        setUploadingFeatureImage(true);

        try {
            const form = new FormData();
            form.append('file', featureFile);
            const res = await postForm(
                `/api/admin/products/${product.id}/feature-image`,
                form,
            );
            if (res.ok) {
                router.reload({ only: ['product'] });
                showToast('Feature image uploaded.', 'success');
                setFeatureFile(null);
            } else {
                showToast(await errorMessageFromResponse(res), 'error');
            }
        } finally {
            setUploadingFeatureImage(false);
        }
    };

    const uploadTopImage = async () => {
        if (!topFile) return;
        setUploadingTopImage(true);

        try {
            const form = new FormData();
            form.append('file', topFile);
            const res = await postForm(
                `/api/admin/products/${product.id}/top-image`,
                form,
            );
            if (res.ok) {
                router.reload({ only: ['product'] });
                showToast('Top image uploaded.', 'success');
                setTopFile(null);
            } else {
                showToast(await errorMessageFromResponse(res), 'error');
            }
        } finally {
            setUploadingTopImage(false);
        }
    };

    const deleteCurrentProduct = async () => {
        if (
            !window.confirm(
                'Are you sure you want to delete this product? This action cannot be undone.',
            )
        ) {
            return;
        }

        setDeletingProduct(true);

        try {
            const res = await delJson(`/api/admin/products/${product.id}`);
            if (res.ok) {
                showToast('Product deleted successfully.', 'success');
                router.visit('/admin/products');
            } else {
                showToast(await errorMessageFromResponse(res), 'error');
            }
        } finally {
            setDeletingProduct(false);
        }
    };

    const resetBasicsForm = () => {
        setPName(product.name);
        setPArticle(product.article ?? '');
        setPDealName(product.deal_name ?? '');
        setPLimitedDiscountText(product.limited_discount_text ?? '');
        setPSlug(product.slug);
        setPSku(product.sku ?? '');
        setPPrice(String(product.price ?? ''));
        setPPurchasePrice(String(product.purchase_price ?? '0'));
        setPStock(String(product.stock ?? '0'));
        setPLowStock(String(product.low_stock_threshold ?? '10'));
        setPDiscount(initialDiscount);
        setPThumb(product.feature_image ?? '');
        setPStoreId(product.store_id ?? stores?.[0]?.id ?? 0);
        setPCategoryId(product.category_id ?? categories?.[0]?.id ?? 0);
        setPSubcategoryId(product.subcategory_id ?? 0);
        setPBrandId(product.brand_id ?? 0);
        setPVisibility(product.visibility ?? 'website_and_mobile');
        setPMetaTitle(product.meta_title ?? '');
        setPMetaDescription(product.meta_description ?? '');
        setPDescription(product.description ?? '');
        setPWarrantyText(product.warranty_text ?? '');
    };

    const inputClassName =
        'h-11 rounded-2xl border-slate-200 bg-white shadow-sm transition focus-visible:border-red-300 focus-visible:ring-red-100';
    const selectClassName =
        'h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm transition focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60';
    const textareaClassName =
        'min-h-[180px] w-full resize-y rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100';
    const sectionCardClassName =
        'rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)] md:p-6';
    const sectionTitleClassName = 'text-base font-semibold text-slate-900';
    const sectionDescriptionClassName = 'mt-1 text-sm text-slate-500';

    const numericPrice = Number(pPrice || product.price || 0);
    const numericDiscount = Number(pDiscount || 0);
    const numericStock = Number(pStock || product.stock || 0);
    const numericLowStock = Number(
        pLowStock || product.low_stock_threshold || 0,
    );
    const discountedPreview =
        numericPrice > 0 && numericDiscount > 0 && numericDiscount < 100
            ? Number(
                  (numericPrice * (1 - numericDiscount / 100)).toFixed(2),
              )
            : numericPrice;
    const stockState =
        numericStock <= 0
            ? {
                  label: 'Out of stock',
                  className: 'border-red-200 bg-red-50 text-red-600',
              }
            : numericStock <= numericLowStock
              ? {
                    label: 'Low stock',
                    className: 'border-amber-200 bg-amber-50 text-amber-700',
                }
              : {
                    label: 'In stock',
                    className:
                        'border-emerald-200 bg-emerald-50 text-emerald-700',
                };
    const discountAmount = Math.max(
        0,
        Number((numericPrice - discountedPreview).toFixed(2)),
    );
    const currentStoreName =
        stores.find((store) => store.id === pStoreId)?.name ?? 'Not assigned';
    const currentBrandName =
        brands.find((brand) => brand.id === pBrandId)?.name ?? 'Not assigned';
    const currentCategoryName =
        categories.find((category) => category.id === pCategoryId)?.name ??
        'Not assigned';
    const currentSubcategoryName =
        filteredSubcategories.find(
            (subcategory) => subcategory.id === pSubcategoryId,
        )?.name ?? 'Not assigned';

    const previewImages = useMemo(() => {
        const seen = new Set<string>();
        const items: Array<{
            key: string;
            path: string;
            label: string;
            isPrimary?: boolean;
        }> = [];
        const push = (
            key: string,
            path: string | null | undefined,
            label: string,
            isPrimary = false,
        ) => {
            if (!path || seen.has(path)) {
                return;
            }

            seen.add(path);
            items.push({ key, path, label, isPrimary });
        };

        push(
            featurePreview ? 'feature-preview' : 'feature-image',
            featurePreview || product.feature_image,
            featurePreview ? 'Feature Preview' : 'Feature Image',
            true,
        );
        push(
            topPreview ? 'top-preview' : 'top-image',
            topPreview || product.top_image,
            topPreview ? 'Top Preview' : 'Top Image',
        );

        [...product.images]
            .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
            .forEach((image) =>
                push(
                    `gallery-${image.id}`,
                    image.path,
                    'Gallery Image',
                    image.is_primary,
                ),
            );

        if (pThumb && pThumb !== product.feature_image) {
            push('thumb-url', pThumb, 'Thumbnail URL');
        }

        return items;
    }, [
        featurePreview,
        pThumb,
        product.feature_image,
        product.images,
        product.top_image,
        topPreview,
    ]);

    useEffect(() => {
        if (!previewImages.length) {
            if (selectedPreviewImage) {
                setSelectedPreviewImage('');
            }
            return;
        }

        if (!previewImages.some((image) => image.path === selectedPreviewImage)) {
            setSelectedPreviewImage(previewImages[0].path);
        }
    }, [previewImages, selectedPreviewImage]);

    const activePreviewImage = selectedPreviewImage || previewImages[0]?.path || '';
    const sectionLinks = [
        { id: 'general', label: 'General', icon: Package2 },
        { id: 'pricing-inventory', label: 'Pricing', icon: Percent },
        { id: 'pricing-inventory', label: 'Inventory', icon: Boxes },
        { id: 'media-gallery', label: 'Media', icon: ImageIcon },
        { id: 'seo-preview', label: 'SEO', icon: FileSearch },
        { id: 'description-section', label: 'Description', icon: ScanLine },
    ];
    const detailRows = [
        { label: 'Store', value: currentStoreName, icon: Package2 },
        { label: 'Brand', value: currentBrandName, icon: Shield },
        { label: 'Category', value: currentCategoryName, icon: FolderTree },
        {
            label: 'Subcategory',
            value: currentSubcategoryName,
            icon: Layers3,
        },
        { label: 'Article', value: pArticle || 'Not assigned', icon: Tag },
    ];

    const hasPendingChanges = useMemo(
        () =>
            pName !== product.name ||
            pArticle !== (product.article ?? '') ||
            pDealName !== (product.deal_name ?? '') ||
            pLimitedDiscountText !== (product.limited_discount_text ?? '') ||
            pSlug !== product.slug ||
            pSku !== (product.sku ?? '') ||
            pPrice !== String(product.price ?? '') ||
            pPurchasePrice !== String(product.purchase_price ?? '0') ||
            pStock !== String(product.stock ?? '0') ||
            pLowStock !== String(product.low_stock_threshold ?? '10') ||
            pDiscount !== initialDiscount ||
            pThumb !== (product.feature_image ?? '') ||
            pStoreId !== (product.store_id ?? stores?.[0]?.id ?? 0) ||
            pCategoryId !== (product.category_id ?? categories?.[0]?.id ?? 0) ||
            pSubcategoryId !== (product.subcategory_id ?? 0) ||
            pBrandId !== (product.brand_id ?? 0) ||
            pMetaTitle !== (product.meta_title ?? '') ||
            pMetaDescription !== (product.meta_description ?? '') ||
            pDescription !== (product.description ?? '') ||
            pVisibility !== (product.visibility ?? 'website_and_mobile') ||
            pWarrantyText !== (product.warranty_text ?? '') ||
            imgPath.trim() !== '' ||
            galleryFile !== null ||
            featureFile !== null ||
            topFile !== null,
        [
            categories,
            featureFile,
            galleryFile,
            imgPath,
            initialDiscount,
            pArticle,
            pBrandId,
            pCategoryId,
            pDealName,
            pDescription,
            pDiscount,
            pLimitedDiscountText,
            pLowStock,
            pMetaDescription,
            pMetaTitle,
            pName,
            pPrice,
            pPurchasePrice,
            pSku,
            pSlug,
            pStock,
            pStoreId,
            pSubcategoryId,
            pThumb,
            pWarrantyText,
            product.article,
            product.brand_id,
            product.category_id,
            product.deal_name,
            product.description,
            product.feature_image,
            product.limited_discount_text,
            product.low_stock_threshold,
            product.meta_description,
            product.meta_title,
            product.name,
            product.price,
            product.purchase_price,
            product.sku,
            product.slug,
            product.stock,
            product.store_id,
            product.subcategory_id,
            product.warranty_text,
            stores,
            topFile,
        ],
    );

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Products', href: '/admin/products' },
                { title: product.name, href: `/admin/products/${product.id}` },
            ]}
        >
            <Head title={`Product: ${product.name}`} />
            <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,238,238,0.9),_transparent_35%),linear-gradient(180deg,_#fffdfd_0%,_#fff7f5_100%)]">
                <div className="mx-auto flex max-w-[1420px] flex-col gap-6 p-4 md:p-6">
                    <Card className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/95 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.28)]">
                        <CardContent className="space-y-6 p-6 md:p-8">
                            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                                <div className="space-y-4">
                                    <a
                                        href="/admin/products"
                                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-800"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Back to Products
                                    </a>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                                            {pName || product.name}
                                        </h1>
                                        <Badge
                                            variant="outline"
                                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${stockState.className}`}
                                        >
                                            {stockState.label}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-5 text-sm text-slate-500">
                                        <span>SKU: {pSku || 'Not set'}</span>
                                        <span>Slug: {pSlug || 'Not set'}</span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-2xl border-slate-200 px-5"
                                        disabled={deletingProduct}
                                        onClick={resetBasicsForm}
                                    >
                                        Reset
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-2xl border-red-200 px-5 text-red-600 hover:bg-red-50 hover:text-red-700"
                                        disabled={deletingProduct || savingBasics}
                                        onClick={() => void deleteCurrentProduct()}
                                    >
                                        {deletingProduct ? (
                                            <>
                                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        type="submit"
                                        form="product-details-form"
                                        className="rounded-2xl bg-[#ff4d4f] px-5 text-white hover:bg-[#eb3d3f]"
                                        disabled={savingBasics || deletingProduct}
                                    >
                                        {savingBasics ? (
                                            <>
                                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                Saving Changes...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm text-slate-500">
                                                Original Price
                                            </div>
                                            <div className="mt-3 text-3xl font-semibold text-slate-950">
                                                Rs {numericPrice || 0}
                                            </div>
                                        </div>
                                        <div className="rounded-2xl bg-red-50 p-3 text-red-500">
                                            <Tag className="h-5 w-5" />
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm text-slate-500">
                                                Discount
                                            </div>
                                            <div className="mt-3 text-3xl font-semibold text-slate-950">
                                                {numericDiscount > 0
                                                    ? `${numericDiscount}%`
                                                    : '0%'}
                                            </div>
                                        </div>
                                        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-500">
                                            <Percent className="h-5 w-5" />
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm text-slate-500">
                                                Stock Quantity
                                            </div>
                                            <div className="mt-3 text-3xl font-semibold text-red-500">
                                                {numericStock}
                                            </div>
                                        </div>
                                        <div className="rounded-2xl bg-red-50 p-3 text-red-500">
                                            <Boxes className="h-5 w-5" />
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm text-slate-500">
                                                Images
                                            </div>
                                            <div className="mt-3 text-3xl font-semibold text-slate-950">
                                                {product.images.length}
                                            </div>
                                        </div>
                                        <div className="rounded-2xl bg-violet-50 p-3 text-violet-500">
                                            <ImageIcon className="h-5 w-5" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-[24px] border border-emerald-100 bg-[linear-gradient(90deg,_rgba(237,255,244,0.95),_rgba(245,255,250,1))] px-5 py-5 shadow-sm">
                                <div>
                                    <div className="text-sm text-slate-500">
                                        Final Price (After Discount)
                                    </div>
                                    <div className="mt-2 text-4xl font-semibold text-emerald-600">
                                        Rs {discountedPreview || 0}
                                    </div>
                                </div>
                                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600">
                                    <Save className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_360px]">
                        <div className="space-y-6">
                            <Card className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_60px_-34px_rgba(15,23,42,0.25)]">
                                <div className="border-b border-slate-200 px-4 py-3">
                                    <div className="flex gap-2 overflow-x-auto">
                                        {sectionLinks.map(({ id, label, icon: Icon }) => (
                                            <a
                                                key={`${id}-${label}`}
                                                href={`#${id}`}
                                                className="inline-flex min-w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:text-red-500"
                                            >
                                                <Icon className="h-4 w-4" />
                                                {label}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                                <CardContent className="p-5 md:p-6">
                                    <form
                                        id="product-details-form"
                                        onSubmit={saveBasics}
                                        className="space-y-6"
                                    >
                                        <section
                                            id="general"
                                            className={sectionCardClassName}
                                        >
                                            <div className="mb-5">
                                                <h2 className={sectionTitleClassName}>
                                                    Product Information
                                                </h2>
                                                <p
                                                    className={
                                                        sectionDescriptionClassName
                                                    }
                                                >
                                                    Basic details and customer-facing
                                                    identifiers for this product.
                                                </p>
                                            </div>
                                            <div className="grid gap-4 md:grid-cols-12">
                                                <div className="md:col-span-6">
                                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                                        Name
                                                    </label>
                                                    <Input
                                                        className={inputClassName}
                                                        value={pName}
                                                        onChange={(e) =>
                                                            setPName(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Product name"
                                                    />
                                                </div>
                                                <div className="md:col-span-4">
                                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                                        Slug
                                                    </label>
                                                    <Input
                                                        className={inputClassName}
                                                        value={pSlug}
                                                        onChange={(e) =>
                                                            setPSlug(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="product-slug"
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="mb-2 block text-sm font-medium text-transparent">
                                                        .
                                                    </label>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="h-11 w-full rounded-2xl border-slate-200"
                                                        onClick={() =>
                                                            setPSlug(
                                                                slugify(pName),
                                                            )
                                                        }
                                                    >
                                                        Auto-generate
                                                    </Button>
                                                </div>
                                                <div className="md:col-span-4">
                                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                                        SKU
                                                    </label>
                                                    <Input
                                                        className={inputClassName}
                                                        value={pSku}
                                                        onChange={(e) =>
                                                            setPSku(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="SKU-0001"
                                                    />
                                                </div>
                                                <div className="md:col-span-4">
                                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                                        Deal Name
                                                    </label>
                                                    <Input
                                                        className={inputClassName}
                                                        value={pDealName}
                                                        onChange={(e) =>
                                                            setPDealName(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="e.g. Eid Offer"
                                                    />
                                                </div>
                                                <div className="md:col-span-6">
                                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                                        Limited Discount Text
                                                    </label>
                                                    <Input
                                                        className={inputClassName}
                                                        value={
                                                            pLimitedDiscountText
                                                        }
                                                        onChange={(e) =>
                                                            setPLimitedDiscountText(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="e.g. 2 days"
                                                    />
                                                </div>
                                                <div className="md:col-span-6">
                                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                                        Thumbnail URL
                                                    </label>
                                                    <Input
                                                        className={inputClassName}
                                                        value={pThumb}
                                                        onChange={(e) =>
                                                            setPThumb(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="/storage/products/..."
                                                    />
                                                </div>
                                            </div>
                                        </section>

                                        <section
                                            id="pricing-inventory"
                                            className={sectionCardClassName}
                                        >
                                            <div className="mb-5">
                                                <h2 className={sectionTitleClassName}>
                                                    Pricing And Inventory
                                                </h2>
                                                <p
                                                    className={
                                                        sectionDescriptionClassName
                                                    }
                                                >
                                                    Keep pricing, margin, stock, and
                                                    reorder levels aligned.
                                                </p>
                                            </div>
                                            <div className="grid gap-4 md:grid-cols-12">
                                                <div className="md:col-span-4">
                                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                                        Original Price
                                                    </label>
                                                    <Input
                                                        className={inputClassName}
                                                        value={pPrice}
                                                        onChange={(e) =>
                                                            setPPrice(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="0.00"
                                                        type="number"
                                                        step="0.01"
                                                    />
                                                </div>
                                                <div className="md:col-span-4">
                                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                                        Cost Price
                                                    </label>
                                                    <Input
                                                        className={inputClassName}
                                                        value={pPurchasePrice}
                                                        onChange={(e) =>
                                                            setPPurchasePrice(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="0.00"
                                                        type="number"
                                                        step="0.01"
                                                    />
                                                </div>
                                                <div className="md:col-span-4">
                                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                                        Discount (%)
                                                    </label>
                                                    <Input
                                                        className={inputClassName}
                                                        value={pDiscount}
                                                        onChange={(e) =>
                                                            setPDiscount(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="0"
                                                        type="number"
                                                        min="0"
                                                        max="99"
                                                    />
                                                </div>
                                                <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/70 px-4 py-4 md:col-span-6">
                                                    <div className="text-sm text-slate-500">
                                                        Final Price Preview
                                                    </div>
                                                    <div className="mt-2 text-2xl font-semibold text-emerald-600">
                                                        Rs {discountedPreview || 0}
                                                    </div>
                                                </div>
                                                <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 md:col-span-6">
                                                    <div className="text-sm text-slate-500">
                                                        Discount Amount
                                                    </div>
                                                    <div className="mt-2 text-2xl font-semibold text-slate-900">
                                                        Rs {discountAmount}
                                                    </div>
                                                </div>
                                                <div className="md:col-span-6">
                                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                                        Stock Quantity
                                                    </label>
                                                    <Input
                                                        className={inputClassName}
                                                        value={pStock}
                                                        onChange={(e) =>
                                                            setPStock(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="0"
                                                        type="number"
                                                    />
                                                </div>
                                                <div className="md:col-span-6">
                                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                                        Low Stock Alert At
                                                    </label>
                                                    <Input
                                                        className={inputClassName}
                                                        value={pLowStock}
                                                        onChange={(e) =>
                                                            setPLowStock(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="10"
                                                        type="number"
                                                    />
                                                </div>
                                            </div>
                                        </section>

                                        <section
                                            id="catalog-placement"
                                            className={sectionCardClassName}
                                        >
                                            <div className="mb-5">
                                                <h2 className={sectionTitleClassName}>
                                                    Catalog Placement
                                                </h2>
                                                <p
                                                    className={
                                                        sectionDescriptionClassName
                                                    }
                                                >
                                                    Assign the correct store,
                                                    category, subcategory, brand,
                                                    and article.
                                                </p>
                                            </div>
                                            <div className="grid gap-4 md:grid-cols-12">
                                                <div className="md:col-span-6">
                                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                                        Store
                                                    </label>
                                                    <select
                                                        className={
                                                            selectClassName
                                                        }
                                                        value={String(pStoreId)}
                                                        onChange={(e) =>
                                                            setPStoreId(
                                                                Number(
                                                                    e.target.value,
                                                                ),
                                                            )
                                                        }
                                                    >
                                                        <option value={0}>
                                                            Select store
                                                        </option>
                                                        {stores.map((store) => (
                                                            <option
                                                                key={store.id}
                                                                value={store.id}
                                                            >
                                                                {store.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="md:col-span-6">
                                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                                        Brand
                                                    </label>
                                                    <select
                                                        className={
                                                            selectClassName
                                                        }
                                                        value={String(pBrandId)}
                                                        onChange={(e) =>
                                                            setPBrandId(
                                                                Number(
                                                                    e.target.value,
                                                                ),
                                                            )
                                                        }
                                                    >
                                                        <option value={0}>
                                                            Select brand
                                                        </option>
                                                        {brands.map((brand) => (
                                                            <option
                                                                key={brand.id}
                                                                value={brand.id}
                                                            >
                                                                {brand.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="md:col-span-6">
                                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                                        Category
                                                    </label>
                                                    <select
                                                        className={
                                                            selectClassName
                                                        }
                                                        value={String(
                                                            pCategoryId,
                                                        )}
                                                        onChange={(e) =>
                                                            setPCategoryId(
                                                                Number(
                                                                    e.target.value,
                                                                ),
                                                            )
                                                        }
                                                    >
                                                        <option value={0}>
                                                            Select category
                                                        </option>
                                                        {categories.map(
                                                            (category) => (
                                                                <option
                                                                    key={
                                                                        category.id
                                                                    }
                                                                    value={
                                                                        category.id
                                                                    }
                                                                >
                                                                    {
                                                                        category.name
                                                                    }
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </div>
                                                <div className="md:col-span-6">
                                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                                        Subcategory
                                                    </label>
                                                    <select
                                                        className={
                                                            selectClassName
                                                        }
                                                        value={String(
                                                            pSubcategoryId,
                                                        )}
                                                        onChange={(e) =>
                                                            setPSubcategoryId(
                                                                Number(
                                                                    e.target.value,
                                                                ),
                                                            )
                                                        }
                                                        disabled={
                                                            !pCategoryId ||
                                                            subcategoriesLoading
                                                        }
                                                    >
                                                        <option value={0}>
                                                            {!pCategoryId
                                                                ? 'Select category first'
                                                                : subcategoriesLoading
                                                                  ? 'Loading subcategories...'
                                                                  : filteredSubcategories.length
                                                                    ? 'Select subcategory'
                                                                    : 'No subcategories available'}
                                                        </option>
                                                        {filteredSubcategories.map(
                                                            (subcategory) => (
                                                                <option
                                                                    key={
                                                                        subcategory.id
                                                                    }
                                                                    value={
                                                                        subcategory.id
                                                                    }
                                                                >
                                                                    {
                                                                        subcategory.name
                                                                    }
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </div>
                                                <div className="md:col-span-12">
                                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                                        Article
                                                    </label>
                                                    <select
                                                        className={
                                                            selectClassName
                                                        }
                                                        value={pArticle}
                                                        onChange={(e) =>
                                                            setPArticle(
                                                                e.target.value,
                                                            )
                                                        }
                                                        disabled={
                                                            !pSubcategoryId ||
                                                            articlesLoading
                                                        }
                                                    >
                                                        <option value="">
                                                            {!pSubcategoryId
                                                                ? 'Select subcategory first'
                                                                : articlesLoading
                                                                  ? 'Loading articles...'
                                                                  : articleOptions.length
                                                                    ? 'Select article'
                                                                    : 'No articles available'}
                                                        </option>
                                                        {articleOptions.map(
                                                            (option) => (
                                                                <option
                                                                    key={
                                                                        option.id
                                                                    }
                                                                    value={
                                                                        option.name
                                                                    }
                                                                >
                                                                    {
                                                                        option.name
                                                                    }
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </div>
                                            </div>
                                        </section>

                                        <section
                                            id="visibility-section"
                                            className={sectionCardClassName}
                                        >
                                            <div className="mb-5">
                                                <h2 className={sectionTitleClassName}>
                                                    Product Visibility
                                                </h2>
                                                <p className={sectionDescriptionClassName}>
                                                    Choose where this product should appear.
                                                </p>
                                            </div>
                                            <select
                                                className="w-full rounded-md border px-3 py-2"
                                                value={pVisibility}
                                                onChange={(e) => setPVisibility(e.target.value)}
                                            >
                                                {VISIBILITY_OPTIONS.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </section>

                                        <section
                                            id="description-section"
                                            className={sectionCardClassName}
                                        >
                                            <div className="mb-5">
                                                <h2 className={sectionTitleClassName}>
                                                    Product Description
                                                </h2>
                                                <p
                                                    className={
                                                        sectionDescriptionClassName
                                                    }
                                                >
                                                    Add a clear description and
                                                    warranty details for the product.
                                                </p>
                                            </div>
                                            <div className="grid gap-4">
                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                                        Description
                                                    </label>
                                                    <textarea
                                                        className={
                                                            textareaClassName
                                                        }
                                                        value={pDescription}
                                                        onChange={(e) =>
                                                            setPDescription(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Full product description..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                                        Warranty
                                                    </label>
                                                    <Input
                                                        className={inputClassName}
                                                        value={pWarrantyText}
                                                        onChange={(e) =>
                                                            setPWarrantyText(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="e.g. 1 year manufacturer warranty"
                                                    />
                                                </div>
                                            </div>
                                        </section>

                                        <section
                                            id="seo-preview"
                                            className={sectionCardClassName}
                                        >
                                            <div className="mb-5">
                                                <h2 className={sectionTitleClassName}>
                                                    SEO Preview
                                                </h2>
                                                <p
                                                    className={
                                                        sectionDescriptionClassName
                                                    }
                                                >
                                                    Improve search appearance with
                                                    a clear title and description.
                                                </p>
                                            </div>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                                        Meta Title
                                                    </label>
                                                    <Input
                                                        className={inputClassName}
                                                        value={pMetaTitle}
                                                        onChange={(e) =>
                                                            setPMetaTitle(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="SEO title"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-slate-600">
                                                        Meta Description
                                                    </label>
                                                    <textarea
                                                        className="min-h-[120px] w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                                                        value={
                                                            pMetaDescription
                                                        }
                                                        onChange={(e) =>
                                                            setPMetaDescription(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="SEO description"
                                                    />
                                                </div>
                                            </div>
                                        </section>
                                    </form>
                                </CardContent>
                            </Card>

                            <Card
                                id="media-gallery"
                                className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_60px_-34px_rgba(15,23,42,0.25)]"
                            >
                                <CardHeader className="border-b border-slate-200 bg-slate-50/70">
                                    <CardTitle className="text-xl font-semibold text-slate-900">
                                        Media And Gallery
                                    </CardTitle>
                                    <CardDescription>
                                        Upload feature, top, and gallery images.
                                        Uploaded images are resized automatically
                                        to 400 x 264 pixels.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6 p-5 md:p-6">
                                    <div className="grid gap-4 lg:grid-cols-2">
                                        <div className="rounded-[24px] border border-slate-200 p-4">
                                            <div className="mb-3 text-sm font-semibold text-slate-900">
                                                Feature Image
                                            </div>
                                            <div className="mb-4 flex h-44 items-center justify-center overflow-hidden rounded-[24px] border border-dashed border-slate-200 bg-slate-50">
                                                {featurePreview ? (
                                                    <img
                                                        src={featurePreview}
                                                        alt=""
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : product.feature_image ? (
                                                    <img
                                                        src={
                                                            product.feature_image
                                                        }
                                                        alt=""
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="text-sm text-slate-400">
                                                        No feature image selected
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-3 sm:flex-row">
                                                <Input
                                                    type="file"
                                                    accept=".png,.jpg,.jpeg,.webp,.gif"
                                                    disabled={
                                                        uploadingFeatureImage
                                                    }
                                                    onChange={(e) =>
                                                        setFeatureFile(
                                                            e.target.files?.[0] ??
                                                                null,
                                                        )
                                                    }
                                                />
                                                <Button
                                                    type="button"
                                                    className="rounded-2xl bg-[#ff4d4f] text-white hover:bg-[#eb3d3f]"
                                                    disabled={
                                                        uploadingFeatureImage ||
                                                        !featureFile
                                                    }
                                                    onClick={() =>
                                                        void uploadFeatureImage()
                                                    }
                                                >
                                                    {uploadingFeatureImage && (
                                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                    )}
                                                    {uploadingFeatureImage
                                                        ? 'Uploading...'
                                                        : 'Upload'}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="rounded-[24px] border border-slate-200 p-4">
                                            <div className="mb-3 text-sm font-semibold text-slate-900">
                                                Top Image
                                            </div>
                                            <div className="mb-4 flex h-44 items-center justify-center overflow-hidden rounded-[24px] border border-dashed border-slate-200 bg-slate-50">
                                                {topPreview ? (
                                                    <img
                                                        src={topPreview}
                                                        alt=""
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : product.top_image ? (
                                                    <img
                                                        src={product.top_image}
                                                        alt=""
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="text-sm text-slate-400">
                                                        No top image selected
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-3 sm:flex-row">
                                                <Input
                                                    type="file"
                                                    accept=".png,.jpg,.jpeg,.webp,.gif"
                                                    disabled={uploadingTopImage}
                                                    onChange={(e) =>
                                                        setTopFile(
                                                            e.target.files?.[0] ??
                                                                null,
                                                        )
                                                    }
                                                />
                                                <Button
                                                    type="button"
                                                    className="rounded-2xl bg-[#ff4d4f] text-white hover:bg-[#eb3d3f]"
                                                    disabled={
                                                        uploadingTopImage ||
                                                        !topFile
                                                    }
                                                    onClick={() =>
                                                        void uploadTopImage()
                                                    }
                                                >
                                                    {uploadingTopImage && (
                                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                    )}
                                                    {uploadingTopImage
                                                        ? 'Uploading...'
                                                        : 'Upload'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-[28px] border border-slate-200 bg-slate-50/60 p-4">
                                        <div className="mb-4">
                                            <div className="text-base font-semibold text-slate-900">
                                                Add Gallery Image
                                            </div>
                                            <div className="mt-1 text-sm text-slate-500">
                                                Upload a file or provide an existing
                                                image path.
                                            </div>
                                        </div>
                                        <form
                                            onSubmit={addImage}
                                            className="grid gap-4 md:grid-cols-3"
                                        >
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-slate-600">
                                                    Image Path
                                                </label>
                                                <Input
                                                    className={inputClassName}
                                                    value={imgPath}
                                                    onChange={(e) =>
                                                        setImgPath(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="/images/path.png"
                                                    disabled={uploadingGallery}
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-slate-600">
                                                    Upload File
                                                </label>
                                                <Input
                                                    type="file"
                                                    accept=".png,.jpg,.jpeg,.webp,.gif"
                                                    disabled={uploadingGallery}
                                                    onChange={(e) =>
                                                        setGalleryFile(
                                                            e.target.files?.[0] ??
                                                                null,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="flex items-end">
                                                <Button
                                                    type="submit"
                                                    className="h-11 w-full rounded-2xl bg-[#ff4d4f] text-white hover:bg-[#eb3d3f]"
                                                    disabled={uploadingGallery}
                                                >
                                                    {uploadingGallery && (
                                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                    )}
                                                    {uploadingGallery
                                                        ? 'Uploading...'
                                                        : 'Add Image'}
                                                </Button>
                                            </div>
                                        </form>
                                        {galleryPreview && (
                                            <div className="mt-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                                <img
                                                    src={galleryPreview}
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {product.images.length > 0 ? (
                                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                            {product.images.map((img) => (
                                                <div
                                                    key={img.id}
                                                    className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"
                                                >
                                                    <div className="relative overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50">
                                                        <img
                                                            src={img.path}
                                                            alt=""
                                                            className="h-52 w-full object-cover"
                                                        />
                                                        {img.is_primary && (
                                                            <span className="absolute left-3 top-3 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                                                                Primary
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-4 space-y-3">
                                                        <div className="truncate text-xs text-slate-500">
                                                            {img.path}
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {!img.is_primary && (
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="rounded-2xl border-slate-200"
                                                                    disabled={
                                                                        settingPrimaryId ===
                                                                            img.id ||
                                                                        deletingImageId ===
                                                                            img.id
                                                                    }
                                                                    onClick={() =>
                                                                        void setPrimaryImage(
                                                                            img.id,
                                                                        )
                                                                    }
                                                                >
                                                                    {settingPrimaryId ===
                                                                    img.id ? (
                                                                        <>
                                                                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                                            Setting...
                                                                        </>
                                                                    ) : (
                                                                        'Set Primary'
                                                                    )}
                                                                </Button>
                                                            )}
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="destructive"
                                                                className="rounded-2xl"
                                                                disabled={
                                                                    deletingImageId ===
                                                                        img.id ||
                                                                    settingPrimaryId ===
                                                                        img.id
                                                                }
                                                                onClick={() =>
                                                                    void deleteImage(
                                                                        img.id,
                                                                    )
                                                                }
                                                            >
                                                                {deletingImageId ===
                                                                img.id ? (
                                                                    <>
                                                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                                        Deleting...
                                                                    </>
                                                                ) : (
                                                                    'Delete'
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                                            No gallery images yet. Add one above to
                                            start building the product preview.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_60px_-34px_rgba(15,23,42,0.25)]">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-xl font-semibold text-slate-900">
                                        Product Preview
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50">
                                        {activePreviewImage ? (
                                            <img
                                                src={activePreviewImage}
                                                alt=""
                                                className="aspect-[4/4.2] w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex aspect-[4/4.2] items-center justify-center text-sm text-slate-400">
                                                No preview image available
                                            </div>
                                        )}
                                        {!!previewImages.find(
                                            (image) =>
                                                image.path ===
                                                    activePreviewImage &&
                                                image.isPrimary,
                                        ) && (
                                            <span className="absolute left-3 top-3 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                                                Primary
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {previewImages
                                            .slice(0, 2)
                                            .map((image) => (
                                                <button
                                                    key={image.key}
                                                    type="button"
                                                    className={`overflow-hidden rounded-[18px] border bg-slate-50 transition ${
                                                        image.path ===
                                                        activePreviewImage
                                                            ? 'border-red-400 ring-2 ring-red-100'
                                                            : 'border-slate-200'
                                                    }`}
                                                    onClick={() =>
                                                        setSelectedPreviewImage(
                                                            image.path,
                                                        )
                                                    }
                                                >
                                                    <img
                                                        src={image.path}
                                                        alt=""
                                                        className="h-20 w-full object-cover"
                                                    />
                                                </button>
                                            ))}
                                        <a
                                            href="#media-gallery"
                                            className="flex h-20 items-center justify-center rounded-[18px] border border-dashed border-slate-200 bg-slate-50 text-sm font-medium text-slate-500 transition hover:border-red-200 hover:text-red-500"
                                        >
                                            Add Image
                                        </a>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_60px_-34px_rgba(15,23,42,0.25)]">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-xl font-semibold text-slate-900">
                                        Product Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {detailRows.map(({ label, value, icon: Icon }) => (
                                        <div
                                            key={label}
                                            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-xl bg-red-50 p-2 text-red-500">
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                                                        {label}
                                                    </div>
                                                    <div className="mt-1 text-sm font-medium text-slate-800">
                                                        {value}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-slate-300">›</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card className="rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_60px_-34px_rgba(15,23,42,0.25)]">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-xl font-semibold text-slate-900">
                                        Pricing Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between text-slate-600">
                                        <span>Original Price</span>
                                        <span>Rs {numericPrice || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-slate-600">
                                        <span>Discount</span>
                                        <span>
                                            {numericDiscount > 0
                                                ? `${numericDiscount}%`
                                                : '0%'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-slate-600">
                                        <span>Discount Amount</span>
                                        <span>Rs {discountAmount}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-emerald-600">
                                        <span>Final Price</span>
                                        <span>Rs {discountedPreview || 0}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_60px_-34px_rgba(15,23,42,0.25)]">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-xl font-semibold text-slate-900">
                                        Inventory Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between text-sm text-slate-600">
                                        <span>Stock Quantity</span>
                                        <span className="font-semibold text-red-500">
                                            {numericStock}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-slate-600">
                                        <span>Low Stock Alert At</span>
                                        <span className="font-semibold text-slate-900">
                                            {numericLowStock}
                                        </span>
                                    </div>
                                    <div
                                        className={`rounded-[24px] border px-4 py-4 ${
                                            numericStock <= 0
                                                ? 'border-red-200 bg-red-50'
                                                : numericStock <= numericLowStock
                                                  ? 'border-amber-200 bg-amber-50'
                                                  : 'border-emerald-200 bg-emerald-50'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle
                                                className={`mt-0.5 h-5 w-5 ${
                                                    numericStock <= 0
                                                        ? 'text-red-500'
                                                        : numericStock <=
                                                            numericLowStock
                                                          ? 'text-amber-500'
                                                          : 'text-emerald-500'
                                                }`}
                                            />
                                            <div>
                                                <div className="font-semibold text-slate-900">
                                                    {stockState.label}
                                                </div>
                                                <div className="mt-1 text-sm text-slate-500">
                                                    {numericStock <= 0
                                                        ? 'This product is currently out of stock.'
                                                        : numericStock <=
                                                            numericLowStock
                                                          ? 'Stock is running low. Consider replenishing soon.'
                                                          : 'Stock level is healthy and ready for sales.'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_60px_-34px_rgba(15,23,42,0.25)]">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-xl font-semibold text-slate-900">
                                        SEO Preview
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                        <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                                            Meta Title
                                        </div>
                                        <div className="mt-2 text-sm font-medium text-slate-800">
                                            {pMetaTitle || 'SEO Title'}
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                        <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                                            Meta Description
                                        </div>
                                        <div className="mt-2 text-sm text-slate-600">
                                            {pMetaDescription ||
                                                'SEO Description'}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <Card className="sticky bottom-4 z-10 rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.28)] backdrop-blur">
                        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="text-base font-semibold text-slate-900">
                                    {hasPendingChanges
                                        ? 'You have unsaved changes'
                                        : 'All changes are saved'}
                                </div>
                                <div className="mt-1 text-sm text-slate-500">
                                    {hasPendingChanges
                                        ? 'Make sure to save your changes before leaving this page.'
                                        : 'Your product details and media are up to date.'}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-2xl border-slate-200 px-6"
                                    disabled={savingBasics}
                                    onClick={resetBasicsForm}
                                >
                                    Reset
                                </Button>
                                <Button
                                    type="submit"
                                    form="product-details-form"
                                    className="rounded-2xl bg-[#ff4d4f] px-6 text-white hover:bg-[#eb3d3f]"
                                    disabled={savingBasics || deletingProduct}
                                >
                                    {savingBasics ? (
                                        <>
                                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                            Saving Changes...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Changes
                                        </>
                                    )}
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
