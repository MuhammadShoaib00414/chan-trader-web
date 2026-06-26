<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\AppBaseController;
use App\Models\Brand;
use Illuminate\Http\Request;

class BrandController extends AppBaseController
{
    /**
     * List Brands
     *
     * @group APP APIs
     *
     * @queryParam q string Search by brand name (partial match). Example: texas
     * @queryParam user_id integer Filter by owner user id. Example: 7
     *
     * @response 200 scenario="success" {
     *   "success": true,
     *   "message": "Brands retrieved",
     *   "data": {
     *     "items": [
     *       {
     *         "id": 5,
     *         "name": "Texas Instruments",
     *         "slug": "texas-instruments",
     *         "logo": "logos/ti.png"
     *       }
     *     ]
     *   }
     * }
     *
     * @unauthenticated
     */
    public function index(Request $request)
    {
        $query = Brand::query()->orderBy('name');
        if ($request->filled('q')) {
            $q = $request->string('q')->toString();
            $query->where('name', 'like', "%{$q}%");
        }
        if ($request->filled('user_id')) {
            $query->where('user_id', (int) $request->get('user_id'));
        }
        $items = $query->get(['id', 'user_id', 'name', 'slug', 'logo']);

        return $this->successResponse(['items' => $items], 'Brands retrieved');
    }
}
