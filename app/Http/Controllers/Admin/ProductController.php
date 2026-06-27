<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Support\ProductVisibility;
use App\Support\VendorCatalogScope;
use App\Models\Store;
use App\Models\Subcategory;
use App\Support\ResizedImageStore;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:products.view')->only(['index', 'show']);
        $this->middleware('permission:products.create')->only(['store']);
        $this->middleware('permission:products.update')->only(['update']);
        $this->middleware('permission:products.delete')->only(['destroy']);
        $this->middleware('permission:products.publish')->only(['publish', 'unpublish']);
        $this->middleware('permission:products.view')->only(['subcategories', 'articles']);
    }

    /**
     * List products (filterable)
     *
     * @group Admin Products
     *
     * @queryParam store_id integer Filter by store ID. Example: 12
     * @queryParam category_id integer Filter by category ID. Example: 7
     * @queryParam q string Search by product name (partial match). Example: resistor
     * @queryParam page integer Page number for pagination. Example: 2
     *
     * @response 200 scenario="success" {
     *   "success": true,
     *   "data": [
     *     {
     *       "id": 101,
     *       "store_id": 12,
     *       "category_id": 7,
     *       "brand_id": 3,
     *       "name": "1kΩ Carbon Film Resistor",
     *       "slug": "1k-ohm-carbon-film-resistor",
     *       "sku": "RES-1K-CF",
     *       "price": 10.50,
     *       "is_published": true
     *     }
     *   ],
     *   "pagination": {
     *     "total": 120,
     *     "per_page": 20,
     *     "current_page": 1,
     *     "last_page": 6
     *   }
     * }
     *
     * @authenticated
     */
    public function index(Request $request)
    {
        $query = Product::query();

        // If the authenticated user is a vendor, only show products from their own stores
        if ($request->user() && $request->user()->hasRole('vendor')) {
            $storeIds = Store::where('owner_id', $request->user()->id)->pluck('id');
            $query->whereIn('store_id', $storeIds);
        }

        if ($request->filled('store_id')) {
            $query->where('store_id', $request->integer('store_id'));
        }
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }
        if ($request->filled('q')) {
            $q = $request->string('q')->toString();
            $query->where('name', 'like', "%{$q}%");
        }
        $products = $query->latest()->paginate(20);

        return response()->json(['success' => true, 'data' => $products->items(), 'pagination' => [
            'total' => $products->total(),
            'per_page' => $products->perPage(),
            'current_page' => $products->currentPage(),
            'last_page' => $products->lastPage(),
        ]]);
    }

    public function inventory(Request $request)
    {
        $this->authorize('viewAny', Product::class);

        $query = Product::query()->with('store:id,name');

        if ($request->filled('store_id')) {
            $query->where('store_id', (int) $request->get('store_id'));
        }

        if ($request->filled('low_stock')) {
            $query->whereColumn('stock', '<=', 'low_stock_threshold');
        }

        $products = $query->select('id', 'store_id', 'name', 'sku', 'stock', 'low_stock_threshold')->paginate(50);

        return response()->json([
            'success' => true,
            'data' => $products->items(),
            'pagination' => [
                'total' => $products->total(),
                'per_page' => $products->perPage(),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
            ]
        ]);
    }

    public function downloadInventory(Request $request)
    {
        $this->authorize('viewAny', Product::class);

        // Placeholder for CSV/Excel generation
        return response()->json([
            'success' => true,
            'message' => 'Inventory details ready for download',
            'data' => [
                'url' => url('/api/admin/inventory/export')
            ]
        ]);
    }

    public function store(Request $request)
    {
        $selectedCategoryId = $request->integer('category_id');

        $validated = $request->validate([
            'store_id' => ['required', 'exists:stores,id'],
            'category_id' => ['required', 'exists:categories,id'],
            'subcategory_id' => $this->subcategoryRules($selectedCategoryId),
            'brand_id' => ['nullable', 'exists:brands,id'],
            'name' => ['required', 'string', 'max:180'],
            'article' => ['nullable', 'string', 'max:160'],
            'deal_name' => ['nullable', 'string', 'max:120'],
            'limited_discount_text' => ['nullable', 'string', 'max:60'],
            'condition' => ['nullable', 'string', 'in:New,Used,Imported'],
            'slug' => ['required', 'string', 'max:200', 'unique:products,slug'],
            'sku' => ['required', 'string', 'max:64', 'unique:products,sku'],
            'short_description' => ['nullable', 'string', 'max:300'],
            'description' => ['nullable', 'string'],
            'feature_image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
            'price' => ['required', 'numeric'],
            'purchase_price' => ['nullable', 'numeric', 'min:0'],
            'discount_price' => ['nullable', 'numeric', 'min:0'],
            'discount_percent' => ['nullable', 'numeric', 'gt:0', 'lt:100'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0'],
            'compare_at' => ['nullable', 'numeric'],
            'unit' => ['nullable', 'string', 'max:32'],
            'warranty_months' => ['nullable', 'integer'],
            'warranty_text' => ['nullable', 'string', 'max:255'],
            'meta_title' => ['nullable', 'string', 'max:180'],
            'meta_description' => ['nullable', 'string', 'max:160'],
            'is_featured' => ['nullable', 'boolean'],
            'is_top_selling' => ['nullable', 'boolean'],
            'visibility' => ProductVisibility::validationRule(),
        ]);

        // Vendors can only create products for their own store(s)
        if ($request->user() && $request->user()->hasRole('vendor')) {
            $storeId = Store::where('owner_id', $request->user()->id)->value('id');
            if (! $storeId) {
                abort(403, 'No store associated with vendor user.');
            }
            $validated['store_id'] = $storeId;
        }

        $validated = $this->normalizeArticleSelection($validated);

        if ($request->user()?->hasRole('vendor')) {
            VendorCatalogScope::authorizeCategoryAccessible($request, (int) $validated['category_id']);
        }

        if ($request->hasFile('feature_image')) {
            $path = ResizedImageStore::store($request->file('feature_image'), 'products/feature');
            $validated['feature_image'] = ResizedImageStore::publicUrl($path);
        }

        $validated = $this->normalizePricing($validated);

        if (!array_key_exists('condition', $validated)) {
            $validated['condition'] = 'New';
        }

        if (! array_key_exists('visibility', $validated) || $validated['visibility'] === null) {
            $validated['visibility'] = ProductVisibility::DEFAULT;
        }

        $product = DB::transaction(function () use ($validated) {
            $product = Product::create($validated);

            if (($validated['stock'] ?? 0) > 0) {
                InventoryMovement::create([
                    'product_id' => $product->id,
                    'qty' => (int) $validated['stock'],
                    'type' => 'in',
                    'reason' => 'Opening stock',
                    'created_at' => now(),
                ]);
            }

            return $product;
        });

        return response()->json(['success' => true, 'message' => 'Product created.', 'data' => $product], 201);
    }

    public function show(Product $product, Request $request)
    {
        VendorCatalogScope::authorizeProductOwned($product, $request);
        return response()->json(['success' => true, 'data' => $product]);
    }

    public function subcategories(Request $request)
    {
        $validated = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
        ]);

        VendorCatalogScope::authorizeCategoryAccessible($request, (int) $validated['category_id']);

        $itemsQuery = Subcategory::query()
            ->where('category_id', (int) $validated['category_id']);
        VendorCatalogScope::applyCatalogUserScope($itemsQuery, $request);
        $items = $itemsQuery
            ->orderBy('name')
            ->get(['id', 'name', 'category_id']);

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    public function articles(Request $request)
    {
        $validated = $request->validate([
            'subcategory_id' => ['required', 'exists:subcategories,id'],
        ]);

        VendorCatalogScope::authorizeSubcategoryOwned($request, (int) $validated['subcategory_id']);

        $itemsQuery = Article::query()
            ->where('subcategory_id', (int) $validated['subcategory_id']);
        VendorCatalogScope::applyUserScope($itemsQuery, $request);
        $items = $itemsQuery
            ->where('is_active', true)
            ->orderByRaw('coalesce(sort_order, 999999) asc')
            ->orderBy('name')
            ->get(['id', 'subcategory_id', 'name', 'slug', 'sort_order']);

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    public function update(Request $request, Product $product)
    {
        VendorCatalogScope::authorizeProductOwned($product, $request);
        $effectiveCategoryId = $request->has('category_id')
            ? $request->integer('category_id')
            : (int) $product->category_id;

        $validated = $request->validate([
            'store_id' => ['sometimes', 'exists:stores,id'],
            'category_id' => ['sometimes', 'exists:categories,id'],
            'subcategory_id' => $this->subcategoryRules($effectiveCategoryId),
            'brand_id' => ['nullable', 'exists:brands,id'],
            'name' => ['sometimes', 'string', 'max:180'],
            'article' => ['nullable', 'string', 'max:160'],
            'deal_name' => ['nullable', 'string', 'max:120'],
            'limited_discount_text' => ['nullable', 'string', 'max:60'],
            'condition' => ['nullable', 'string', 'in:New,Used,Imported'],
            'slug' => ['sometimes', 'string', 'max:200', Rule::unique('products', 'slug')->ignore($product->id)],
            'sku' => ['sometimes', 'string', 'max:64', Rule::unique('products', 'sku')->ignore($product->id)],
            'short_description' => ['nullable', 'string', 'max:300'],
            'description' => ['nullable', 'string'],
            'feature_image' => ['nullable', 'string', 'max:255'],
            'top_image' => ['nullable', 'string', 'max:255'],
            'price' => ['sometimes', 'numeric'],
            'purchase_price' => ['nullable', 'numeric', 'min:0'],
            'discount_price' => ['nullable', 'numeric', 'min:0'],
            'discount_percent' => ['nullable', 'numeric', 'gt:0', 'lt:100'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0'],
            'compare_at' => ['nullable', 'numeric'],
            'unit' => ['nullable', 'string', 'max:32'],
            'warranty_months' => ['nullable', 'integer'],
            'warranty_text' => ['nullable', 'string', 'max:255'],
            'meta_title' => ['nullable', 'string', 'max:180'],
            'meta_description' => ['nullable', 'string', 'max:160'],
            'is_featured' => ['nullable', 'boolean'],
            'is_top_selling' => ['nullable', 'boolean'],
            'visibility' => ProductVisibility::validationRule(),
        ]);

        if (
            array_key_exists('category_id', $validated) &&
            ! array_key_exists('subcategory_id', $validated) &&
            $product->subcategory_id
        ) {
            $hasMatchingSubcategory = Subcategory::query()
                ->whereKey($product->subcategory_id)
                ->where('category_id', (int) $validated['category_id'])
                ->exists();

            if (! $hasMatchingSubcategory) {
                $validated['subcategory_id'] = null;
            }
        }

        $validated = $this->normalizeArticleSelection($validated, $product);
        $validated = $this->normalizePricing($validated, $product);

        DB::transaction(function () use ($product, $validated) {
            $originalStock = (int) $product->stock;
            $product->update($validated);

            if (array_key_exists('stock', $validated)) {
                $newStock = (int) $validated['stock'];
                $difference = $newStock - $originalStock;

                if ($difference !== 0) {
                    InventoryMovement::create([
                        'product_id' => $product->id,
                        'qty' => abs($difference),
                        'type' => 'adjust',
                        'reason' => $difference > 0 ? 'Manual stock increase' : 'Manual stock decrease',
                        'created_at' => now(),
                    ]);
                }
            }
        });

        return response()->json(['success' => true, 'message' => 'Product updated.', 'data' => $product]);
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function normalizeArticleSelection(array $validated, ?Product $product = null): array
    {
        if (array_key_exists('article', $validated)) {
            $validated['article'] = is_string($validated['article'])
                ? trim($validated['article'])
                : $validated['article'];

            if ($validated['article'] === '') {
                $validated['article'] = null;
            }
        }

        $effectiveSubcategoryId = array_key_exists('subcategory_id', $validated)
            ? (int) ($validated['subcategory_id'] ?? 0)
            : (int) ($product?->subcategory_id ?? 0);

        if (
            $effectiveSubcategoryId > 0 &&
            array_key_exists('article', $validated) &&
            $validated['article'] !== null &&
            ! Article::query()
                ->where('subcategory_id', $effectiveSubcategoryId)
                ->where('is_active', true)
                ->where('name', $validated['article'])
                ->exists()
        ) {
            throw ValidationException::withMessages([
                'article' => 'Selected article is not available for the chosen subcategory.',
            ]);
        }

        return $validated;
    }

    /**
     * @return array<int, mixed>
     */
    private function subcategoryRules(?int $categoryId): array
    {
        $rule = Rule::exists('subcategories', 'id');

        if ($categoryId) {
            $rule = $rule->where(fn ($query) => $query->where('category_id', $categoryId));
        }

        return ['nullable', $rule];
    }

    /**
     * Normalize incoming pricing so APIs consistently expose:
     * - `price` as the original selling price
     * - `discount_percent` as the discount percentage
     * - `discountedPrice` as a computed value on read
     *
     * Supports clients that send either:
     * - original `price` + `discount_percent`
     * - `price` + `discount_price`
     * - `price` + lower `compare_at` (treat lower value as discount price)
     * - `price` + higher `compare_at` (legacy client sending discounted price in `price`)
     *
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function normalizePricing(array $validated, ?Product $product = null): array
    {
        $hasPrice = array_key_exists('price', $validated);
        $basePrice = $hasPrice ? (float) $validated['price'] : (float) ($product?->price ?? 0);

        $hasCompareAt = array_key_exists('compare_at', $validated);
        $hasDiscountPrice = array_key_exists('discount_price', $validated);
        $hasDiscountPercent = array_key_exists('discount_percent', $validated);

        if (! $hasCompareAt && ! $hasDiscountPrice && ! $hasDiscountPercent) {
            unset($validated['discount_price']);
            unset($validated['discount_percent']);

            return $validated;
        }

        $compareAt = $hasCompareAt && $validated['compare_at'] !== null
            ? (float) $validated['compare_at']
            : null;
        $discountPrice = $hasDiscountPrice && $validated['discount_price'] !== null
            ? (float) $validated['discount_price']
            : null;
        $discountPercent = $hasDiscountPercent && $validated['discount_percent'] !== null
            ? (float) $validated['discount_percent']
            : null;

        if ($discountPercent !== null) {
            if ($basePrice > 0 && $discountPercent > 0 && $discountPercent < 100) {
                $validated['price'] = round($basePrice, 2);
                $validated['discount_percent'] = round($discountPercent, 2);
            } else {
                $validated['price'] = $basePrice;
                $validated['discount_percent'] = null;
                $validated['compare_at'] = null;
            }

            unset($validated['discount_price']);
            $validated['compare_at'] = null;

            return $validated;
        }

        if ($discountPrice !== null) {
            if ($basePrice > 0 && $discountPrice > 0 && $discountPrice < $basePrice) {
                $validated['price'] = round($basePrice, 2);
                $validated['discount_percent'] = round((($basePrice - $discountPrice) / $basePrice) * 100, 2);
            } else {
                $validated['price'] = $basePrice;
                $validated['discount_percent'] = null;
                $validated['compare_at'] = null;
            }

            unset($validated['discount_price']);
            $validated['compare_at'] = null;

            return $validated;
        }

        if ($compareAt !== null && $basePrice > 0 && $compareAt > 0 && $compareAt < $basePrice) {
            $validated['price'] = round($basePrice, 2);
            $validated['discount_percent'] = round((($basePrice - $compareAt) / $basePrice) * 100, 2);
            $validated['compare_at'] = null;
        } elseif ($compareAt !== null && $compareAt > $basePrice && $compareAt > 0) {
            $validated['price'] = round($compareAt, 2);
            $validated['discount_percent'] = round((($compareAt - $basePrice) / $compareAt) * 100, 2);
            $validated['compare_at'] = null;
        } elseif ($compareAt !== null) {
            $validated['discount_percent'] = null;
            $validated['compare_at'] = null;
        }

        unset($validated['discount_price']);
        $validated['compare_at'] = null;

        return $validated;
    }

    public function uploadFeatureImage(Request $request, Product $product)
    {
        VendorCatalogScope::authorizeProductOwned($product, $request);
        $request->validate([
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
        ]);
        ResizedImageStore::deletePublicPath($product->feature_image);
        $path = ResizedImageStore::store($request->file('file'), "products/{$product->id}/feature");
        $product->update(['feature_image' => ResizedImageStore::publicUrl($path)]);

        return response()->json(['success' => true, 'data' => ['feature_image' => $product->feature_image]]);
    }

    public function uploadTopImage(Request $request, Product $product)
    {
        VendorCatalogScope::authorizeProductOwned($product, $request);
        $request->validate([
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
        ]);
        ResizedImageStore::deletePublicPath($product->top_image);
        $path = ResizedImageStore::store($request->file('file'), "products/{$product->id}/top");
        $product->update(['top_image' => ResizedImageStore::publicUrl($path)]);

        return response()->json(['success' => true, 'data' => ['top_image' => $product->top_image]]);
    }

    public function destroy(Product $product, Request $request)
    {
        VendorCatalogScope::authorizeProductOwned($product, $request);
        $product->delete();

        return response()->json(['success' => true, 'message' => 'Product deleted.']);
    }

    public function publish(Product $product, Request $request)
    {
        VendorCatalogScope::authorizeProductOwned($product, $request);
        $product->update(['is_published' => true, 'published_at' => now()]);

        return response()->json(['success' => true, 'message' => 'Product published.', 'data' => $product]);
    }

    public function unpublish(Product $product, Request $request)
    {
        VendorCatalogScope::authorizeProductOwned($product, $request);
        $product->update(['is_published' => false, 'published_at' => null]);

        return response()->json(['success' => true, 'message' => 'Product unpublished.', 'data' => $product]);
    }
}
