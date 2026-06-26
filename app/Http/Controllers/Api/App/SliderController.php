<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\AppBaseController;
use App\Models\Slider;
use Illuminate\Http\Request;

class SliderController extends AppBaseController
{
    /**
     * List Active Sliders
     *
     * @group APP APIs
     *
     * @queryParam per_page integer Items per page (default 20). Example: 20
     *
     * @unauthenticated
     */
    public function index(Request $request)
    {
        $perPage = max(1, (int) ($request->get('per_page') ?? 20));

        $items = Slider::query()
            ->where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('id')
            ->paginate($perPage);

        return $this->successResponse([
            'items' => $items->items(),
            'pagination' => [
                'total' => $items->total(),
                'per_page' => $items->perPage(),
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
            ],
        ], 'Sliders retrieved');
    }
}
