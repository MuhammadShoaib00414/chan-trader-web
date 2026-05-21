import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
import { delJson, patchJson, postJson } from '@/lib/http';
import { Head, router, usePage } from '@inertiajs/react';
import {
    ArrowUpDown,
    ChevronDown,
    ChevronUp,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const slugify = (s: string) =>
    s
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

type CategoryRef = { id: number; name: string };
type SubcategoryRef = { id: number; name: string; category_id: number };
type ArticleItem = {
    id: number;
    subcategory_id: number;
    name: string;
    slug: string;
    sort_order: number | null;
    is_active: boolean;
    subcategory?: {
        id: number;
        name: string;
        category_id: number;
        category?: { id: number; name: string } | null;
    } | null;
};
type Pagination = {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
};
type PageProps = {
    items: ArticleItem[];
    categories: CategoryRef[];
    subcategories: SubcategoryRef[];
    pagination?: Pagination;
    filters?: {
        q?: string;
        category_id?: string | number;
        subcategory_id?: string | number;
        sort_by?: string;
        sort_dir?: 'asc' | 'desc';
    };
};

export default function ArticlesIndex() {
    const { props } = usePage<PageProps>();
    const items = props.items ?? [];
    const categories = props.categories ?? [];
    const subcategories = props.subcategories ?? [];
    const pagination = props.pagination;

    const [query, setQuery] = useState(props.filters?.q ?? '');
    const [categoryId, setCategoryId] = useState(
        props.filters?.category_id ? String(props.filters.category_id) : '',
    );
    const [subcategoryId, setSubcategoryId] = useState(
        props.filters?.subcategory_id
            ? String(props.filters.subcategory_id)
            : '',
    );
    const [sortBy, setSortBy] = useState(props.filters?.sort_by ?? 'sort_order');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>(
        props.filters?.sort_dir ?? 'asc',
    );

    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editing, setEditing] = useState<ArticleItem | null>(null);
    const [deleting, setDeleting] = useState<ArticleItem | null>(null);
    const [form, setForm] = useState({
        category_id: categories[0]?.id ? String(categories[0].id) : '',
        subcategory_id: '',
        name: '',
        slug: '',
        sort_order: '',
        is_active: true,
    });
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
            if (data?.message && typeof data.message === 'string') {
                return data.message;
            }
            const firstError = data?.errors
                ? Object.values<any>(data.errors)?.flat()?.[0]
                : null;
            if (firstError && typeof firstError === 'string') {
                return firstError;
            }
            return `Request failed (${res.status}).`;
        } catch {
            return `Request failed (${res.status}).`;
        }
    };

    const resetForm = () =>
        setForm({
            category_id: categories[0]?.id ? String(categories[0].id) : '',
            subcategory_id: '',
            name: '',
            slug: '',
            sort_order: '',
            is_active: true,
        });

    const filteredFormSubcategories = useMemo(
        () =>
            subcategories.filter(
                (subcategory) =>
                    String(subcategory.category_id) === form.category_id,
            ),
        [form.category_id, subcategories],
    );

    const filteredSubcategories = useMemo(
        () =>
            subcategories.filter(
                (subcategory) =>
                    !categoryId ||
                    String(subcategory.category_id) === categoryId,
            ),
        [categoryId, subcategories],
    );

    useEffect(() => {
        if (
            form.subcategory_id &&
            !filteredFormSubcategories.some(
                (subcategory) =>
                    String(subcategory.id) === form.subcategory_id,
            )
        ) {
            setForm((current) => ({ ...current, subcategory_id: '' }));
        }
    }, [filteredFormSubcategories, form.subcategory_id]);

    useEffect(() => {
        if (
            subcategoryId &&
            !filteredSubcategories.some(
                (subcategory) => String(subcategory.id) === subcategoryId,
            )
        ) {
            setSubcategoryId('');
        }
    }, [filteredSubcategories, subcategoryId]);

    useEffect(() => {
        setQuery(props.filters?.q ?? '');
        setCategoryId(
            props.filters?.category_id ? String(props.filters.category_id) : '',
        );
        setSubcategoryId(
            props.filters?.subcategory_id
                ? String(props.filters.subcategory_id)
                : '',
        );
        setSortBy(props.filters?.sort_by ?? 'sort_order');
        setSortDir((props.filters?.sort_dir as 'asc' | 'desc') ?? 'asc');
    }, [props.filters]);

    const applyFilters = (extra?: Record<string, unknown>) => {
        router.get(
            '/admin/articles',
            {
                q: query || undefined,
                category_id: categoryId || undefined,
                subcategory_id: subcategoryId || undefined,
                sort_by: sortBy,
                sort_dir: sortDir,
                ...(extra ?? {}),
            },
            { preserveScroll: true, preserveState: true },
        );
    };

    const toggleSort = (key: string) => {
        if (sortBy === key) {
            const dir = sortDir === 'asc' ? 'desc' : 'asc';
            setSortDir(dir);
            applyFilters({ page: 1, sort_by: key, sort_dir: dir });
            return;
        }

        setSortBy(key);
        setSortDir('asc');
        applyFilters({ page: 1, sort_by: key, sort_dir: 'asc' });
    };

    const addArticle = async () => {
        const res = await postJson('/api/admin/articles', {
            subcategory_id: Number(form.subcategory_id),
            name: form.name,
            slug: form.slug,
            sort_order: form.sort_order ? Number(form.sort_order) : null,
            is_active: form.is_active,
        });

        if (res.ok) {
            resetForm();
            setAddOpen(false);
            try {
                const data = (await res.json()) as any;
                showToast(data?.message ?? 'Article created.', 'success');
            } catch {
                showToast('Article created.', 'success');
            }
            applyFilters({ page: pagination?.current_page ?? 1 });
            return;
        }

        showToast(await errorMessageFromResponse(res), 'error');
    };

    const startEdit = (article: ArticleItem) => {
        setEditing(article);
        setForm({
            category_id: String(article.subcategory?.category_id ?? ''),
            subcategory_id: String(article.subcategory_id),
            name: article.name,
            slug: article.slug,
            sort_order: article.sort_order ? String(article.sort_order) : '',
            is_active: article.is_active,
        });
        setEditOpen(true);
    };

    const saveEdit = async () => {
        if (!editing) return;

        const res = await patchJson(`/api/admin/articles/${editing.id}`, {
            subcategory_id: Number(form.subcategory_id),
            name: form.name,
            slug: form.slug,
            sort_order: form.sort_order ? Number(form.sort_order) : null,
            is_active: form.is_active,
        });

        if (res.ok) {
            setEditOpen(false);
            setEditing(null);
            resetForm();
            try {
                const data = (await res.json()) as any;
                showToast(data?.message ?? 'Article updated.', 'success');
            } catch {
                showToast('Article updated.', 'success');
            }
            applyFilters({ page: pagination?.current_page ?? 1 });
            return;
        }

        showToast(await errorMessageFromResponse(res), 'error');
    };

    const confirmDelete = async () => {
        if (!deleting) return;

        const res = await delJson(`/api/admin/articles/${deleting.id}`);
        if (res.ok) {
            setDeleteOpen(false);
            setDeleting(null);
            try {
                const data = (await res.json()) as any;
                showToast(data?.message ?? 'Article deleted.', 'success');
            } catch {
                showToast('Article deleted.', 'success');
            }
            applyFilters({ page: pagination?.current_page ?? 1 });
            return;
        }

        showToast(await errorMessageFromResponse(res), 'error');
    };

    const canPrev = useMemo(
        () => (pagination ? pagination.current_page > 1 : false),
        [pagination],
    );
    const canNext = useMemo(
        () => (pagination ? pagination.current_page < pagination.last_page : false),
        [pagination],
    );

    const formFields = (
        <div className="grid gap-3">
            <div>
                <label className="mb-1 block text-sm">Category</label>
                <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={form.category_id}
                    onChange={(e) =>
                        setForm((current) => ({
                            ...current,
                            category_id: e.target.value,
                            subcategory_id: '',
                        }))
                    }
                >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="mb-1 block text-sm">Subcategory</label>
                <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={form.subcategory_id}
                    onChange={(e) =>
                        setForm((current) => ({
                            ...current,
                            subcategory_id: e.target.value,
                        }))
                    }
                    disabled={!filteredFormSubcategories.length}
                >
                    <option value="">
                        {filteredFormSubcategories.length
                            ? 'Select subcategory'
                            : 'No subcategories available'}
                    </option>
                    {filteredFormSubcategories.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>
                            {subcategory.name}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="mb-1 block text-sm">Article Name</label>
                <Input
                    value={form.name}
                    onChange={(e) =>
                        setForm((current) => ({
                            ...current,
                            name: e.target.value,
                            slug:
                                !current.slug ||
                                current.slug === slugify(current.name)
                                    ? slugify(e.target.value)
                                    : current.slug,
                        }))
                    }
                    placeholder="Article 12"
                />
            </div>
            <div>
                <label className="mb-1 block text-sm">Slug</label>
                <Input
                    value={form.slug}
                    onChange={(e) =>
                        setForm((current) => ({
                            ...current,
                            slug: e.target.value,
                        }))
                    }
                    placeholder="article-12"
                />
            </div>
            <div>
                <label className="mb-1 block text-sm">Order</label>
                <Input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) =>
                        setForm((current) => ({
                            ...current,
                            sort_order: e.target.value,
                        }))
                    }
                    placeholder="Auto"
                />
            </div>
            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) =>
                        setForm((current) => ({
                            ...current,
                            is_active: e.target.checked,
                        }))
                    }
                />
                Active
            </label>
        </div>
    );

    return (
        <AppLayout breadcrumbs={[{ title: 'Articles', href: '/admin/articles' }]}>
            <Head title="Articles" />

            <div className="grid gap-6 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search articles..."
                            className="md:max-w-sm"
                        />
                        <select
                            className="h-9 rounded-md border bg-background px-3 text-sm"
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                        >
                            <option value="">All categories</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        <select
                            className="h-9 rounded-md border bg-background px-3 text-sm"
                            value={subcategoryId}
                            onChange={(e) => setSubcategoryId(e.target.value)}
                        >
                            <option value="">All subcategories</option>
                            {filteredSubcategories.map((subcategory) => (
                                <option key={subcategory.id} value={subcategory.id}>
                                    {subcategory.name}
                                </option>
                            ))}
                        </select>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => applyFilters({ page: 1 })}
                        >
                            Search
                        </Button>
                        {(query || categoryId || subcategoryId) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setQuery('');
                                    setCategoryId('');
                                    setSubcategoryId('');
                                    router.get(
                                        '/admin/articles',
                                        {
                                            sort_by: sortBy,
                                            sort_dir: sortDir,
                                            page: 1,
                                        },
                                        {
                                            preserveScroll: true,
                                            preserveState: true,
                                        },
                                    );
                                }}
                            >
                                Clear
                            </Button>
                        )}
                    </div>

                    <Dialog
                        open={addOpen}
                        onOpenChange={(open) => {
                            setAddOpen(open);
                            if (!open) resetForm();
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button size="lg">
                                <Plus className="mr-2 size-4" /> Add Article
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Article</DialogTitle>
                            </DialogHeader>
                            {formFields}
                            <DialogFooter>
                                <Button onClick={addArticle}>Save</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="rounded-xl border bg-card shadow-md">
                    <div className="hidden w-full overflow-x-auto md:block">
                        <Table className="min-w-[900px]">
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead className="w-16 text-xs uppercase tracking-wide">
                                        <button
                                            type="button"
                                            className="flex items-center gap-1"
                                            onClick={() => toggleSort('id')}
                                        >
                                            ID{' '}
                                            {sortBy === 'id' ? (
                                                sortDir === 'asc' ? (
                                                    <ChevronUp className="size-3" />
                                                ) : (
                                                    <ChevronDown className="size-3" />
                                                )
                                            ) : (
                                                <ArrowUpDown className="size-3" />
                                            )}
                                        </button>
                                    </TableHead>
                                    <TableHead className="text-xs uppercase tracking-wide">
                                        <button
                                            type="button"
                                            className="flex items-center gap-1"
                                            onClick={() => toggleSort('name')}
                                        >
                                            Name{' '}
                                            {sortBy === 'name' ? (
                                                sortDir === 'asc' ? (
                                                    <ChevronUp className="size-3" />
                                                ) : (
                                                    <ChevronDown className="size-3" />
                                                )
                                            ) : (
                                                <ArrowUpDown className="size-3" />
                                            )}
                                        </button>
                                    </TableHead>
                                    <TableHead className="text-xs uppercase tracking-wide">
                                        Slug
                                    </TableHead>
                                    <TableHead className="text-xs uppercase tracking-wide">
                                        Category
                                    </TableHead>
                                    <TableHead className="text-xs uppercase tracking-wide">
                                        Subcategory
                                    </TableHead>
                                    <TableHead className="text-xs uppercase tracking-wide">
                                        <button
                                            type="button"
                                            className="flex items-center gap-1"
                                            onClick={() => toggleSort('sort_order')}
                                        >
                                            Order{' '}
                                            {sortBy === 'sort_order' ? (
                                                sortDir === 'asc' ? (
                                                    <ChevronUp className="size-3" />
                                                ) : (
                                                    <ChevronDown className="size-3" />
                                                )
                                            ) : (
                                                <ArrowUpDown className="size-3" />
                                            )}
                                        </button>
                                    </TableHead>
                                    <TableHead className="text-xs uppercase tracking-wide">
                                        Status
                                    </TableHead>
                                    <TableHead className="text-right text-xs uppercase tracking-wide">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((article) => (
                                    <TableRow key={article.id}>
                                        <TableCell>{article.id}</TableCell>
                                        <TableCell className="font-medium">
                                            {article.name}
                                        </TableCell>
                                        <TableCell>{article.slug}</TableCell>
                                        <TableCell>
                                            {article.subcategory?.category?.name ?? '-'}
                                        </TableCell>
                                        <TableCell>
                                            {article.subcategory?.name ?? '-'}
                                        </TableCell>
                                        <TableCell>
                                            {article.sort_order ?? '-'}
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`rounded-full px-2 py-1 text-xs ${
                                                    article.is_active
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}
                                            >
                                                {article.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => startEdit(article)}
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => {
                                                        setDeleting(article);
                                                        setDeleteOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="grid gap-3 p-4 md:hidden">
                        {items.map((article) => (
                            <div
                                key={article.id}
                                className="rounded-lg border bg-background p-4 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="font-medium">{article.name}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {article.slug}
                                        </div>
                                    </div>
                                    <span
                                        className={`rounded-full px-2 py-1 text-xs ${
                                            article.is_active
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        {article.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                                    <div>
                                        Category: {article.subcategory?.category?.name ?? '-'}
                                    </div>
                                    <div>
                                        Subcategory: {article.subcategory?.name ?? '-'}
                                    </div>
                                    <div>Order: {article.sort_order ?? '-'}</div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => startEdit(article)}
                                    >
                                        <Pencil className="mr-2 size-4" /> Edit
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => {
                                            setDeleting(article);
                                            setDeleteOpen(true);
                                        }}
                                    >
                                        <Trash2 className="mr-2 size-4" /> Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {items.length === 0 && (
                        <div className="p-8 text-center">
                            <h3 className="text-lg font-semibold">No articles found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Add articles for a subcategory to organize this catalog.
                            </p>
                        </div>
                    )}

                    {pagination && pagination.total > 0 && (
                        <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
                            <div className="text-muted-foreground">
                                Showing{' '}
                                <span className="font-medium">
                                    {(pagination.current_page - 1) *
                                        pagination.per_page +
                                        1}
                                </span>{' '}
                                to{' '}
                                <span className="font-medium">
                                    {Math.min(
                                        pagination.current_page * pagination.per_page,
                                        pagination.total,
                                    )}
                                </span>{' '}
                                of{' '}
                                <span className="font-medium">{pagination.total}</span>{' '}
                                articles
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!canPrev}
                                    onClick={() =>
                                        applyFilters({
                                            page: (pagination.current_page ?? 1) - 1,
                                        })
                                    }
                                >
                                    Previous
                                </Button>
                                <div className="text-sm">
                                    Page {pagination.current_page} of{' '}
                                    {pagination.last_page}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!canNext}
                                    onClick={() =>
                                        applyFilters({
                                            page: (pagination.current_page ?? 1) + 1,
                                        })
                                    }
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Dialog
                open={editOpen}
                onOpenChange={(open) => {
                    setEditOpen(open);
                    if (!open) {
                        setEditing(null);
                        resetForm();
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Article</DialogTitle>
                    </DialogHeader>
                    {formFields}
                    <DialogFooter>
                        <Button onClick={saveEdit}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Article</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Delete "{deleting?.name}"? This action will soft-delete the
                        record.
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ToastStack toasts={toasts} onDismiss={dismissToast} />
        </AppLayout>
    );
}
