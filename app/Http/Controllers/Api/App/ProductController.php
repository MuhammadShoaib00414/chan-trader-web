<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\AppBaseController;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends AppBaseController
{
    /**
     * List products (APP, paginated)
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
            ->with(['images' => function ($q) {
                $q->where('is_primary', true)->select('id', 'product_id', 'path', 'is_primary');
            }])
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

        $sortBy = in_array($request->get('sort_by'), ['created_at', 'price', 'name']) ? $request->get('sort_by') : 'created_at';
        $sortDir = in_array($request->get('sort_dir'), ['asc', 'desc']) ? $request->get('sort_dir') : 'desc';
        $perPage = max(1, (int) ($request->get('per_page') ?? 20));

        $products = $query->orderBy($sortBy, $sortDir)->paginate($perPage)->withQueryString();

        $items = $products->through(function ($p) {
            return [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'sku' => $p->sku,
                'price' => $p->price,
                'thumb' => $p->feature_image ?: optional($p->images->first())->path,
                'feature_image' => $p->feature_image,
                'top_image' => $p->top_image,
                'has_primary_image' => $p->images->isNotEmpty(),
                'store' => $p->store ? ['id' => $p->store->id, 'name' => $p->store->name] : null,
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
            'filters' => [
                'q' => $request->get('q'),
                'category_id' => $request->get('category_id'),
                'store_id' => $request->get('store_id'),
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ],
        ], 'Products retrieved');
    }
}
