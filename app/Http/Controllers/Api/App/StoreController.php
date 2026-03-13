<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\AppBaseController;
use App\Models\Store;
use Illuminate\Http\Request;

class StoreController extends AppBaseController
{
    public function index(Request $request)
    {
        $query = Store::query()->where('status', 'active');
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
        ], 'Store retrieved');
    }
}
