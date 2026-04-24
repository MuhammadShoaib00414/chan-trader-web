<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\AppBaseController;
use App\Models\Store;
use Illuminate\Http\Request;

class StoreController extends AppBaseController
{
    /**
     * List Stores
     *
     * @group APP APIs
     *
     * @queryParam q string Search by store name (partial match). Example: electronics
     * @queryParam per_page integer Items per page (default 20). Example: 20
     * @queryParam page integer Page number for pagination. Example: 1
     *
     * @unauthenticated
     */
    public function index(Request $request)
    {
        $query = Store::query()
            ->where('status', 'active')
            ->withCount([
                'products as products_count' => fn ($products) => $products->where('is_published', true),
            ]);

        if ($request->filled('q')) {
            $q = $request->string('q')->toString();
            $query->where('name', 'like', "%{$q}%");
        }
        $perPage = max(1, (int) ($request->get('per_page') ?? 20));
        $stores = $query->orderBy('name')->paginate($perPage)->withQueryString();

        $items = collect($stores->items())->map(function ($s) {
            return [
                'id' => $s->id,
                'name' => $s->name,
                'slug' => $s->slug,
                'logo' => $s->logo,
                'banner' => $s->banner,
                'rating_avg' => $s->rating_avg,
                'products_count' => $s->products_count,
                'business_whatsapp_url' => $s->business_whatsapp_url,
            ];
        });

        return $this->successResponse([
            'items' => $items,
            'pagination' => [
                'total' => $stores->total(),
                'per_page' => $stores->perPage(),
                'current_page' => $stores->currentPage(),
                'last_page' => $stores->lastPage(),
            ],
            'filters' => [
                'q' => $request->get('q'),
            ],
        ], 'Stores retrieved');
    }

    public function show(Store $store)
    {
        if ($store->status !== 'active') {
            return $this->errorResponse('Store not active', 404);
        }

        $store->loadCount([
            'products as products_count' => fn ($products) => $products->where('is_published', true),
        ]);

        return $this->successResponse([
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
        ], 'Store retrieved');
    }
}
