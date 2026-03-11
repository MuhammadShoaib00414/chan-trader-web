<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'store_id' => ['required', 'exists:stores,id'],
            'category_id' => ['required', 'exists:categories,id'],
            'brand_id' => ['nullable', 'exists:brands,id'],
            'name' => ['required', 'string', 'max:180'],
            'slug' => ['required', 'string', 'max:200', 'unique:products,slug'],
            'sku' => ['required', 'string', 'max:64', 'unique:products,sku'],
            'short_description' => ['nullable', 'string', 'max:300'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric'],
            'compare_at' => ['nullable', 'numeric'],
            'unit' => ['nullable', 'string', 'max:32'],
            'warranty_months' => ['nullable', 'integer'],
        ]);
        $product = Product::create($validated);
        return response()->json(['success' => true, 'data' => $product], 201);
    }

    public function show(Product $product)
    {
        return response()->json(['success' => true, 'data' => $product]);
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'store_id' => ['sometimes', 'exists:stores,id'],
            'category_id' => ['sometimes', 'exists:categories,id'],
            'brand_id' => ['nullable', 'exists:brands,id'],
            'name' => ['sometimes', 'string', 'max:180'],
            'slug' => ['sometimes', 'string', 'max:200', Rule::unique('products', 'slug')->ignore($product->id)],
            'sku' => ['sometimes', 'string', 'max:64', Rule::unique('products', 'sku')->ignore($product->id)],
            'short_description' => ['nullable', 'string', 'max:300'],
            'description' => ['nullable', 'string'],
            'price' => ['sometimes', 'numeric'],
            'compare_at' => ['nullable', 'numeric'],
            'unit' => ['nullable', 'string', 'max:32'],
            'warranty_months' => ['nullable', 'integer'],
        ]);
        $product->update($validated);
        return response()->json(['success' => true, 'data' => $product]);
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json(['success' => true]);
    }

    public function publish(Product $product)
    {
        $product->update(['is_published' => true, 'published_at' => now()]);
        return response()->json(['success' => true, 'data' => $product]);
    }

    public function unpublish(Product $product)
    {
        $product->update(['is_published' => false, 'published_at' => null]);
        return response()->json(['success' => true, 'data' => $product]);
    }
}
