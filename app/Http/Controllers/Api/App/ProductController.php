<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\AppBaseController;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Http\Request;

class ProductController extends AppBaseController
{
    /**
     * List Products
     *
     * @group APP APIs
     *
     * @queryParam q string Search by product name or SKU (partial match). Example: resistor
     * @queryParam category_id integer Filter by category ID. Example: 7
     * @queryParam subcategory_id integer Filter by subcategory ID. Example: 15
     * @queryParam store_id integer Filter by store ID. Example: 12
     * @queryParam sort_by string Sort field. Allowed: created_at, price, name. Example: price
     * @queryParam sort_dir string Sort direction. Allowed: asc, desc. Example: asc
     * @queryParam per_page integer Items per page (default 20). Example: 20
     * @queryParam page integer Page number for pagination. Example: 2
     *
     * @response 200 scenario="success" {
     *   "success": true,
     *   "message": "Products retrieved",
     *   "data": {
     *     "items": [
     *       {
     *         "id": 101,
     *         "name": "1kΩ Carbon Film Resistor",
     *         "slug": "1k-ohm-carbon-film-resistor",
     *         "sku": "RES-1K-CF",
     *         "price": 10.5,
     *         "thumb": "images/p101.png",
     *         "has_primary_image": true,
     *         "store": { "id": 12, "name": "Ali Store" },
     *         "category": { "id": 7, "name": "Resistors" }
     *       }
     *     ],
     *     "pagination": {
     *       "total": 120,
     *       "per_page": 20,
     *       "current_page": 1,
     *       "last_page": 6
     *     }
     *   }
     * }
     *
     * @unauthenticated
     */
    public function index(Request $request)
    {
        $query = $this->appProductQuery();

        if ($request->filled('q')) {
            $q = $request->string('q')->toString();
            $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhere('sku', 'like', "%{$q}%");
            });
        }
        if ($request->filled('category_id')) {
            $query->where('category_id', (int) $request->get('category_id'));
        }
        if ($request->filled('subcategory_id')) {
            $query->where('subcategory_id', (int) $request->get('subcategory_id'));
        }
        if ($request->filled('store_id')) {
            $query->where('store_id', (int) $request->get('store_id'));
        }
        if ($request->filled('is_featured')) {
            $query->where('is_featured', $request->boolean('is_featured'));
        }
        if ($request->filled('is_top_selling')) {
            $query->where('is_top_selling', $request->boolean('is_top_selling'));
        }

        $sortBy = in_array($request->get('sort_by'), ['created_at', 'price', 'name']) ? $request->get('sort_by') : 'created_at';
        $sortDir = in_array($request->get('sort_dir'), ['asc', 'desc']) ? $request->get('sort_dir') : 'desc';
        $perPage = max(1, (int) ($request->get('per_page') ?? 20));

        $products = $query->orderBy($sortBy, $sortDir)->paginate($perPage)->withQueryString();

        $items = $products->getCollection()
            ->map(fn ($product) => array_merge($this->formatAppProduct($product), [
                'stock_status' => $this->getStockStatus($product)
            ]))
            ->values();

        return $this->successResponse([
            'items' => $items,
            'pagination' => [
                'total' => $products->total(),
                'per_page' => $products->perPage(),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
            ],
        ], 'Products retrieved');
    }

    /**
     * Get Single Product
     *
     * @group APP APIs
     *
     * @urlParam id integer required Product ID. Example: 101
     *
     * @response 200 scenario="success" {
     *   "success": true,
     *   "message": "Product retrieved",
     *   "data": {
     *     "id": 101,
     *     "name": "1kΩ Carbon Film Resistor",
     *     "slug": "1k-ohm-carbon-film-resistor",
     *     "sku": "RES-1K-CF",
     *     "price": 10.5,
     *     "compare_at": 15.0,
     *     "stock": 100,
     *     "condition": "new",
     *     "short_description": "High quality carbon film resistor",
     *     "description": "Detailed product description...",
     *     "feature_image": "images/p101.png",
     *     "rating_avg": 4.5,
     *     "rating_count": 25,
     *     "store": {
     *       "id": 12,
     *       "name": "Ali Store",
     *       "email": "contact@alistore.com",
     *       "phone": "+1234567890",
     *       "city": "Lahore",
     *       "address": "123 Main Street",
     *       "rating_avg": 4.8,
     *       "followers_count": 150
     *     },
     *     "category": { "id": 7, "name": "Resistors" },
     *     "subcategory": { "id": 15, "name": "Carbon Film" },
     *     "brand": { "id": 3, "name": "Brand Name" }
     *   }
     * }
     *
     * @unauthenticated
     */
    public function show($id)
    {
        $product = $this->appProductQuery()->find($id);

        if (!$product) {
            return $this->errorResponse('Product not found or not available', 404);
        }

        // Get related products (same category, excluding current product)
        $relatedProducts = $this->appProductQuery()
            ->where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn ($relatedProduct) => $this->formatAppProduct($relatedProduct))
            ->values();

        $productData = $this->formatAppProduct($product);
        $productData['related_products'] = $relatedProducts;
        $productData['stock_status'] = $this->getStockStatus($product);

        return $this->successResponse($productData, 'Product retrieved');
    }

    /**
     * Home Screen Data
     * 
     * @group APP APIs
     */
    public function home()
    {
        $categories = \App\Models\Category::where('is_active', true)
            ->orderBy('sort_order')
            ->limit(8)
            ->get(['id', 'name', 'slug', 'image']);

        $topSelling = $this->appProductQuery()
            ->where('is_top_selling', true)
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn ($product) => $this->formatAppProduct($product))
            ->values();

        $featured = $this->appProductQuery()
            ->where('is_featured', true)
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn ($product) => $this->formatAppProduct($product))
            ->values();

        $popularStores = $this->popularStoresQuery()
            ->orderByDesc('rating_avg')
            ->limit(5)
            ->get()
            ->map(fn (Store $store) => $this->formatAppStore($store))
            ->values();

        return $this->successResponse([
            'categories' => $categories,
            'top_selling' => $topSelling,
            'featured_products' => $featured,
            'popular_stores' => $popularStores,
        ], 'Home data retrieved');
    }

    /**
     * Get category-wise product counts
     *
     * @group APP APIs
     */
    public function categoryCounts()
    {
        $counts = \App\Models\Category::where('is_active', true)
            ->withCount(['products' => function ($query) {
                $query->where('is_published', true);
            }])
            ->orderBy('sort_order')
            ->get(['id', 'name', 'products_count']);

        return $this->successResponse([
            'categories' => $counts,
        ], 'Category product counts retrieved');
    }

    private function appProductQuery()
    {
        return Product::query()
            ->where('is_published', true)
            ->with($this->appProductRelations());
    }

    /**
     * @return array<int, mixed>
     */
    private function appProductRelations(): array
    {
        return [
            'store:id,name,email,phone,city,address,rating_avg,followers_count,business_whatsapp_url',
            'category:id,name,slug',
            'subcategory:id,name,slug',
            'brand:id,name,slug',
            'images',
            'reviews' => fn ($query) => $query->where('is_visible', true)
                ->with('user:id,first_name,last_name,avatar')
                ->latest()
                ->limit(5),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatAppProduct(Product $product): array
    {
        $primaryImage = $product->images->firstWhere('is_primary', true) ?? $product->images->sortBy('sort_order')->first();

        return [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'sku' => $product->sku,
            'condition' => $product->condition,
            'price' => $product->price,
            'compare_at' => $product->compare_at,
            'discountedPrice' => $product->discounted_price,
            'discount_percent' => $product->discount_percent,
            'stock' => $product->stock,
            'unit' => $product->unit,
            'short_description' => $product->short_description,
            'description' => $product->description,
            'feature_image' => $product->feature_image,
            'top_image' => $product->top_image,
            'thumb' => $product->feature_image ?: $primaryImage?->path,
            'has_primary_image' => $product->images->contains(fn ($image) => (bool) $image->is_primary),
            'warranty_months' => $product->warranty_months,
            'warranty_text' => $product->warranty_text,
            'is_featured' => $product->is_featured,
            'is_top_selling' => $product->is_top_selling,
            'is_published' => $product->is_published,
            'rating_avg' => $product->rating_avg,
            'rating_count' => $product->rating_count,
            'images' => $product->images->map(fn ($image) => [
                'id' => $image->id,
                'path' => $image->path,
                'alt' => $image->alt ?? null,
                'is_primary' => $image->is_primary,
                'sort_order' => $image->sort_order,
            ])->values(),
            'store' => $product->store ? [
                'id' => $product->store->id,
                'name' => $product->store->name,
                'email' => $product->store->email,
                'phone' => $product->store->phone,
                'business_whatsapp_url' => $product->store->business_whatsapp_url,
                'city' => $product->store->city,
                'address' => $product->store->address,
                'rating_avg' => $product->store->rating_avg,
                'followers_count' => $product->store->followers_count,
            ] : null,
            'category' => $product->category ? [
                'id' => $product->category->id,
                'name' => $product->category->name,
                'slug' => $product->category->slug,
            ] : null,
            'subcategory' => $product->subcategory ? [
                'id' => $product->subcategory->id,
                'name' => $product->subcategory->name,
                'slug' => $product->subcategory->slug,
            ] : null,
            'brand' => $product->brand ? [
                'id' => $product->brand->id,
                'name' => $product->brand->name,
                'slug' => $product->brand->slug,
            ] : null,
            'store_name' => $product->store?->name,
            'reviews' => $product->reviews->map(fn ($review) => [
                'id' => $review->id,
                'rating' => $review->rating,
                'comment' => $review->comment,
                'created_at' => $review->created_at,
                'user' => $review->user ? [
                    'id' => $review->user->id,
                    'name' => trim($review->user->first_name . ' ' . $review->user->last_name),
                    'avatar' => $review->user->avatar,
                ] : null,
            ])->values(),
        ];
    }

    private function popularStoresQuery()
    {
        return Store::query()
            ->where('status', 'active')
            ->withCount([
                'products as products_count' => fn ($products) => $products->where('is_published', true),
            ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatAppStore(Store $store): array
    {
        return [
            'id' => $store->id,
            'name' => $store->name,
            'slug' => $store->slug,
            'logo' => $store->logo,
            'banner' => $store->banner,
            'rating_avg' => $store->rating_avg,
            'products_count' => $store->products_count,
            'followers_count' => $store->followers_count,
            'description' => $store->description,
            'business_whatsapp_url' => $store->business_whatsapp_url,
            'city' => $store->city,
        ];
    }

    /**
     * Get stock status for a product
     *
     * @return array<string, mixed>
     */
    private function getStockStatus(Product $product): array
    {
        $stock = $product->stock ?? 0;

        if ($stock <= 0) {
            return [
                'status' => 'out_of_stock',
                'message' => 'Out of stock',
                'quantity_left' => 0,
                'is_available' => false,
            ];
        } elseif ($stock <= 5) {
            return [
                'status' => 'low_stock',
                'message' => 'Only ' . $stock . ' left',
                'quantity_left' => $stock,
                'is_available' => true,
            ];
        } else {
            return [
                'status' => 'in_stock',
                'message' => 'In stock',
                'quantity_left' => $stock,
                'is_available' => true,
            ];
        }
    }
}
