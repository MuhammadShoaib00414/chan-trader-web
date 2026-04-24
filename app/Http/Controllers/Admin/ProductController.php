<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Store;
use App\Models\Subcategory;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:products.view')->only(['index', 'show']);
        $this->middleware('permission:products.create')->only(['store']);
        $this->middleware('permission:products.update')->only(['update']);
        $this->middleware('permission:products.delete')->only(['destroy']);
        $this->middleware('permission:products.publish')->only(['publish', 'unpublish']);
        $this->middleware('permission:products.view')->only(['subcategories']);
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
            'condition' => ['nullable', 'string', 'in:New,Used,Imported'],
            'slug' => ['required', 'string', 'max:200', 'unique:products,slug'],
            'sku' => ['required', 'string', 'max:64', 'unique:products,sku'],
            'short_description' => ['nullable', 'string', 'max:300'],
            'description' => ['nullable', 'string'],
            'feature_image' => ['nullable', 'image', 'max:5120'],
            'price' => ['required', 'numeric'],
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
        ]);

        // Vendors can only create products for their own store(s)
        if ($request->user() && $request->user()->hasRole('vendor')) {
            $storeId = Store::where('owner_id', $request->user()->id)->value('id');
            if (! $storeId) {
                abort(403, 'No store associated with vendor user.');
            }
            $validated['store_id'] = $storeId;
        }

        if ($request->hasFile('feature_image')) {
            $path = $request->file('feature_image')->storePublicly('products/feature', ['disk' => 'public']);
            $validated['feature_image'] = "/storage/{$path}";
        }

        $product = Product::create($validated);

        return response()->json(['success' => true, 'message' => 'Product created.', 'data' => $product], 201);
    }

    public function show(Product $product)
    {
        return response()->json(['success' => true, 'data' => $product]);
    }

    public function subcategories(Request $request)
    {
        $validated = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
        ]);

        $items = Subcategory::query()
            ->where('category_id', (int) $validated['category_id'])
            ->orderBy('name')
            ->get(['id', 'name', 'category_id']);

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $effectiveCategoryId = $request->has('category_id')
            ? $request->integer('category_id')
            : (int) $product->category_id;

        $validated = $request->validate([
            'store_id' => ['sometimes', 'exists:stores,id'],
            'category_id' => ['sometimes', 'exists:categories,id'],
            'subcategory_id' => $this->subcategoryRules($effectiveCategoryId),
            'brand_id' => ['nullable', 'exists:brands,id'],
            'name' => ['sometimes', 'string', 'max:180'],
            'condition' => ['nullable', 'string', 'in:New,Used,Imported'],
            'slug' => ['sometimes', 'string', 'max:200', Rule::unique('products', 'slug')->ignore($product->id)],
            'sku' => ['sometimes', 'string', 'max:64', Rule::unique('products', 'sku')->ignore($product->id)],
            'short_description' => ['nullable', 'string', 'max:300'],
            'description' => ['nullable', 'string'],
            'feature_image' => ['nullable', 'string', 'max:255'],
            'top_image' => ['nullable', 'string', 'max:255'],
            'price' => ['sometimes', 'numeric'],
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

        $product->update($validated);

        return response()->json(['success' => true, 'message' => 'Product updated.', 'data' => $product]);
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

    public function uploadFeatureImage(Request $request, Product $product)
    {
        $request->validate([
            'file' => ['required', 'image', 'max:5120'],
        ]);
        $path = $request->file('file')->storePublicly("products/{$product->id}", ['disk' => 'public']);
        $product->update(['feature_image' => "/storage/{$path}"]);

        return response()->json(['success' => true, 'data' => ['feature_image' => $product->feature_image]]);
    }

    public function uploadTopImage(Request $request, Product $product)
    {
        $request->validate([
            'file' => ['required', 'image', 'max:5120'],
        ]);
        $path = $request->file('file')->storePublicly("products/{$product->id}", ['disk' => 'public']);
        $product->update(['top_image' => "/storage/{$path}"]);

        return response()->json(['success' => true, 'data' => ['top_image' => $product->top_image]]);
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return response()->json(['success' => true, 'message' => 'Product deleted.']);
    }

    public function publish(Product $product)
    {
        $product->update(['is_published' => true, 'published_at' => now()]);

        return response()->json(['success' => true, 'message' => 'Product published.', 'data' => $product]);
    }

    public function unpublish(Product $product)
    {
        $product->update(['is_published' => false, 'published_at' => null]);

        return response()->json(['success' => true, 'message' => 'Product unpublished.', 'data' => $product]);
    }
}
