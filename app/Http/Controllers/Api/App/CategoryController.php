<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\AppBaseController;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends AppBaseController
{
    /**
     * List categories (APP)
     *
     * @group APP APIs
     *
     * @queryParam q string Search by category name (partial match). Example: resistors
     *
     * @response 200 scenario="success" {
     *   "success": true,
     *   "message": "Categories retrieved",
     *   "data": {
     *     "items": [
     *       {
     *         "id": 9,
     *         "name": "Capacitors",
     *         "slug": "capacitors",
     *         "icon": "category-icons/capacitors.svg",
     *         "is_active": true
     *       }
     *     ]
     *   }
     * }
     *
     * @unauthenticated
     */
    public function index(Request $request)
    {
        $query = Category::query()->orderBy('sort_order')->orderBy('name');
        if ($request->filled('q')) {
            $q = $request->string('q')->toString();
            $query->where('name', 'like', "%{$q}%");
        }
        $items = $query->get(['id','name','slug','icon','is_active']);
        return $this->successResponse(['items' => $items], 'Categories retrieved');
    }
}
