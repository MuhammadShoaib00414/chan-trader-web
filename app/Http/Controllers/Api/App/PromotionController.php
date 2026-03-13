<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\AppBaseController;
use App\Models\Promotion;
use Illuminate\Http\Request;

class PromotionController extends AppBaseController
{
    /**
     * List active promotions (APP)
     *
     * @group APP APIs
     *
     * @queryParam per_page integer Items per page (default 20). Example: 20
     * @queryParam page integer Page number for pagination. Example: 1
     *
     * @unauthenticated
     */
    public function index(Request $request)
    {
        $perPage = max(1, (int) ($request->get('per_page') ?? 20));

        $items = Promotion::query()
            ->where('is_active', true)
            ->with(['product:id,name,slug,sku,price'])
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return $this->successResponse([
            'items' => $items->items(),
            'pagination' => [
                'total' => $items->total(),
                'per_page' => $items->perPage(),
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
            ],
        ], 'Promotions retrieved');
    }
}
