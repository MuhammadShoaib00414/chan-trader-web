<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\AppBaseController;
use App\Models\Product;
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
        $query = Product::query()
            ->with(['store:id,name', 'category:id,name']);

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

        $items = $products->getCollection()->map(function ($p) {
            return [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'sku' => $p->sku,
                'condition' => $p->condition,
                'price' => $p->price,
                'compare_at' => $p->compare_at,
                'feature_image' => $p->feature_image,
                'rating_avg' => $p->rating_avg,
                'rating_count' => $p->rating_count,
                'store' => $p->store ? [
                    'id' => $p->store->id, 
                    'name' => $p->store->name,
                    'city' => $p->store->city
                ] : null,
                'category' => $p->category ? ['id' => $p->category->id, 'name' => $p->category->name] : null,
            ];
        });

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
     * Home Screen Data
     * 
     * @group APP APIs
     */
    public function home()
    {
        $categories = \App\Models\Category::where('is_active', true)
            ->orderBy('sort_order')
            ->limit(8)
            ->get(['id', 'name', 'image']);

        $topSelling = Product::where('is_published', true)
            ->where('is_top_selling', true)
            ->with('store:id,name')
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'price' => $p->price,
                'feature_image' => $p->feature_image,
                'rating_avg' => $p->rating_avg,
                'rating_count' => $p->rating_count,
                'store_name' => optional($p->store)->name,
            ]);

        $featured = Product::where('is_published', true)
            ->where('is_featured', true)
            ->with('store:id,name')
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'price' => $p->price,
                'feature_image' => $p->feature_image,
                'rating_avg' => $p->rating_avg,
                'rating_count' => $p->rating_count,
                'store_name' => optional($p->store)->name,
            ]);

        $popularStores = \App\Models\Store::where('status', 'active')
            ->orderByDesc('rating_avg')
            ->limit(5)
            ->get(['id', 'name', 'logo', 'city', 'rating_avg', 'products_count']);

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
}
