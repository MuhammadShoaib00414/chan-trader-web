<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\AppBaseController;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends AppBaseController
{
    /**
     * List Categories
     *
     * @group APP APIs
     *
     * @queryParam q string Search by category name (partial match). Example: resistors
     * @queryParam user_id integer Filter by owner user id. Example: 7
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
     *         "image": "category-icons/capacitors.svg",
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
        if ($request->filled('user_id')) {
            $query->where('user_id', (int) $request->get('user_id'));
        }
        $items = $query->get(['id', 'user_id', 'name', 'slug', 'image', 'is_active']);

        return $this->successResponse(['items' => $items], 'Categories retrieved');
    }
}
