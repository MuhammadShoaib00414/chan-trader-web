<?php

namespace App\Http\Controllers\Api\App;

use App\Api\SubcategoryApi;
use App\Http\Controllers\AppBaseController;
use Illuminate\Http\Request;

class SubcategoryController extends AppBaseController
{
    public function __construct(public SubcategoryApi $subcategories) {}

    /**
     * List Active Subcategories
     *
     * @group APP APIs
     *
     * @queryParam category_id integer Filter by category id. Example: 3
     * @queryParam user_id integer Filter by owner user id. Example: 7
     *
     * @unauthenticated
     */
    public function index(Request $request)
    {
        $categoryId = $request->filled('category_id') ? (int) $request->get('category_id') : null;
        $userId = $request->filled('user_id') ? (int) $request->get('user_id') : null;

        $items = $this->subcategories->listForApp($categoryId, $userId);

        return $this->successResponse([
            'items' => $items,
        ], 'Subcategories retrieved');
    }
}
