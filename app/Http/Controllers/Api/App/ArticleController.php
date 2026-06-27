<?php

namespace App\Http\Controllers\Api\App;

use App\Api\ArticleApi;
use App\Http\Controllers\AppBaseController;
use Illuminate\Http\Request;

class ArticleController extends AppBaseController
{
    public function __construct(public ArticleApi $articles) {}

    /**
     * List Active Articles
     *
     * @group APP APIs
     *
     * @queryParam q string Search by article name (partial match). Example: article 101
     * @queryParam category_id integer Filter by category id. Example: 3
     * @queryParam subcategory_id integer Filter by subcategory id. Example: 8
     * @queryParam user_id integer Filter by owner user id. Example: 7
     *
     * @unauthenticated
     */
    public function index(Request $request)
    {
        $categoryId = $request->filled('category_id') ? (int) $request->get('category_id') : null;
        $subcategoryId = $request->filled('subcategory_id') ? (int) $request->get('subcategory_id') : null;
        $queryText = $request->filled('q') ? $request->string('q')->toString() : null;
        $userId = $request->filled('user_id') ? (int) $request->get('user_id') : null;

        $items = $this->articles
            ->listForApp($categoryId, $subcategoryId, $queryText, $userId)
            ->map(fn ($article) => [
                'id' => $article->id,
                'user_id' => $article->user_id,
                'subcategory_id' => $article->subcategory_id,
                'name' => $article->name,
                'slug' => $article->slug,
                'sort_order' => $article->sort_order,
                'is_active' => $article->is_active,
                'subcategory' => $article->subcategory ? [
                    'id' => $article->subcategory->id,
                    'category_id' => $article->subcategory->category_id,
                    'name' => $article->subcategory->name,
                    'slug' => $article->subcategory->slug,
                ] : null,
                'category' => $article->subcategory?->category ? [
                    'id' => $article->subcategory->category->id,
                    'name' => $article->subcategory->category->name,
                    'slug' => $article->subcategory->category->slug,
                ] : null,
            ])
            ->values();

        return $this->successResponse([
            'items' => $items,
        ], 'Articles retrieved');
    }
}
