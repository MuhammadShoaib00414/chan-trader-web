<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\AppBaseController;
use App\Http\Requests\Api\VoiceSearchRequest;
use App\Models\Product;

class VoiceSearchController extends AppBaseController
{
    /**
     * Voice-Based Product Search
     *
     * @group APP APIs
     *
     * Accepts a voice query (converted speech-to-text from the Flutter app)
     * and returns matching products using partial matching on name, description,
     * short_description, sku, and meta_title.
     *
     * @bodyParam query string required The speech-to-text string from the Flutter app. Example: wireless headphones
     * @bodyParam per_page integer Number of results per page (default 20, max 100). Example: 20
     *
     * @response 200 scenario="results found" {
     *   "success": true,
     *   "message": "Voice search results",
     *   "data": {
     *     "query": "wireless headphones",
     *     "total": 5,
     *     "items": [
     *       {
     *         "id": 1,
     *         "name": "Wireless Headphones Pro",
     *         "slug": "wireless-headphones-pro",
     *         "sku": "WHP-001",
     *         "price": 49.99,
     *         "compare_at": 69.99,
     *         "stock": 25,
     *         "stock_status": "Available",
     *         "short_description": "Premium wireless headphones",
     *         "feature_image": "images/whp001.png",
     *         "rating_avg": 4.5,
     *         "rating_count": 12,
     *         "store": { "id": 1, "name": "Tech Store" },
     *         "category": { "id": 3, "name": "Audio" },
     *         "subcategory": { "id": 7, "name": "Headphones" },
     *         "brand": { "id": 2, "name": "SoundMax" }
     *       }
     *     ],
     *     "pagination": {
     *       "total": 5,
     *       "per_page": 20,
     *       "current_page": 1,
     *       "last_page": 1
     *     }
     *   }
     * }
     *
     * @response 422 scenario="validation error" {
     *   "success": false,
     *   "message": "Voice query text is required.",
     *   "data": null
     * }
     *
     * @unauthenticated
     */
    public function search(VoiceSearchRequest $request)
    {
        $rawQuery = trim($request->string('query')->toString());
        $perPage  = max(1, min(100, (int) ($request->get('per_page') ?? 20)));

        // Tokenise: split on whitespace, drop empty/single-char tokens
        $tokens = array_values(array_filter(
            explode(' ', preg_replace('/\s+/', ' ', $rawQuery)),
            fn($t) => strlen($t) > 1
        ));
    //    dd($rawQuery,$tokens);
        $query = Product::query()
            ->with([
                'store:id,name',
                'category:id,name,slug',
                'subcategory:id,name,slug',
                'brand:id,name,slug',
                'reviews' => fn($q) => $q->where('is_visible', true)
                    ->with('user:id,first_name,last_name,avatar')
                    ->latest()
                    ->limit(5),
            ])
            ->where('is_published', true);

        if (empty($tokens)) {
            // Fallback: treat the whole string as one token
            $tokens = [$rawQuery];
        }

        // Each token must match at least one of the searchable columns (AND between tokens)
        foreach ($tokens as $token) {
            $like = "%{$token}%";
            $query->where(function ($sub) use ($like) {
                $sub->where('name', 'like', $like)
                    ->orWhere('short_description', 'like', $like)
                    ->orWhere('description', 'like', $like)
                    ->orWhere('sku', 'like', $like)
                    ->orWhere('meta_title', 'like', $like)
                    ->orWhere('meta_description', 'like', $like);
            });
        }

        // Boost relevance: exact name match first, then name partial, then rest
        $query->orderByRaw("
            CASE
                WHEN LOWER(name) = ?          THEN 0
                WHEN name LIKE ?              THEN 1
                ELSE                               2
            END
        ", [strtolower($rawQuery), "%{$rawQuery}%"])
        ->orderByDesc('rating_avg')
        ->orderByDesc('is_featured');

        $paginated = $query->paginate($perPage)->withQueryString();

        $items = $paginated->getCollection()->map(fn($p) => [
            'id'                => $p->id,
            'name'              => $p->name,
            'slug'              => $p->slug,
            'sku'               => $p->sku,
            'condition'         => $p->condition,
            'price'             => $p->price,
            'compare_at'        => $p->compare_at,
            'stock'             => $p->stock,
            'stock_status'      => $p->stock_status,
            'short_description' => $p->short_description,
            'feature_image'     => $p->feature_image,
            'rating_avg'        => $p->rating_avg,
            'rating_count'      => $p->rating_count,
            'store'             => $p->store    ? ['id' => $p->store->id,    'name' => $p->store->name]    : null,
            'category'          => $p->category ? ['id' => $p->category->id, 'name' => $p->category->name, 'slug' => $p->category->slug] : null,
            'subcategory'       => $p->subcategory ? ['id' => $p->subcategory->id, 'name' => $p->subcategory->name, 'slug' => $p->subcategory->slug] : null,
            'brand'             => $p->brand    ? ['id' => $p->brand->id,    'name' => $p->brand->name,    'slug' => $p->brand->slug]    : null,
            'reviews'           => $p->reviews->map(fn($r) => [
                'id'         => $r->id,
                'rating'     => $r->rating,
                'comment'    => $r->comment,
                'created_at' => $r->created_at,
                'user'       => $r->user ? [
                    'id'     => $r->user->id,
                    'name'   => trim($r->user->first_name . ' ' . $r->user->last_name),
                    'avatar' => $r->user->avatar,
                ] : null,
            ]),
        ]);

        return $this->successResponse([
            'query' => $rawQuery,
            'items' => $items,
            'pagination' => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
        ], 'Voice search results');
    }
}
