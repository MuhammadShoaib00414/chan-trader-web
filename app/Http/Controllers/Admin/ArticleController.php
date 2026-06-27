<?php

namespace App\Http\Controllers\Admin;

use App\Api\ArticleApi;
use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Support\VendorCatalogScope;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ArticleController extends Controller
{
    public function __construct(public ArticleApi $articles)
    {
        $this->middleware('permission:articles.manage')->only(['index', 'store', 'show', 'update', 'destroy']);
    }

    public function index(Request $request)
    {
        $items = $this->articles->listForAdmin($request->only(['q', 'category_id', 'subcategory_id', 'sort_by', 'sort_dir']), VendorCatalogScope::vendorUserId($request));

        return response()->json([
            'success' => true,
            'data' => $items->items(),
            'pagination' => [
                'total' => $items->total(),
                'per_page' => $items->perPage(),
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $subcategoryId = (int) $request->input('subcategory_id');

        $validated = $request->validate([
            'subcategory_id' => ['required', 'exists:subcategories,id'],
            'name' => ['required', 'string', 'max:160'],
            'slug' => [
                'required',
                'string',
                'max:180',
                Rule::unique('articles', 'slug')->where(fn ($query) => $query->where('subcategory_id', $subcategoryId)),
            ],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['boolean'],
        ]);

        VendorCatalogScope::authorizeSubcategoryOwned($request, (int) $validated['subcategory_id']);
        $validated = VendorCatalogScope::assignUserId($validated, $request);
        $article = $this->articles->create($validated);

        return response()->json(['success' => true, 'message' => 'Article created.', 'data' => $article], 201);
    }

    public function show(Article $article, Request $request)
    {
        VendorCatalogScope::authorizeUserOwned($article, $request);
        $article->load(['subcategory:id,category_id,name', 'subcategory.category:id,name']);

        return response()->json(['success' => true, 'data' => $article]);
    }

    public function update(Request $request, Article $article)
    {
        VendorCatalogScope::authorizeUserOwned($article, $request);
        $subcategoryId = (int) $request->input('subcategory_id', $article->subcategory_id);

        $validated = $request->validate([
            'subcategory_id' => ['sometimes', 'exists:subcategories,id'],
            'name' => ['sometimes', 'string', 'max:160'],
            'slug' => [
                'sometimes',
                'string',
                'max:180',
                Rule::unique('articles', 'slug')
                    ->where(fn ($query) => $query->where('subcategory_id', $subcategoryId))
                    ->ignore($article->id),
            ],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['boolean'],
        ]);

        if (array_key_exists('subcategory_id', $validated)) {
            VendorCatalogScope::authorizeSubcategoryOwned($request, (int) $validated['subcategory_id']);
        }
        $article = $this->articles->update($article, $validated);

        return response()->json(['success' => true, 'message' => 'Article updated.', 'data' => $article]);
    }

    public function destroy(Article $article, Request $request)
    {
        VendorCatalogScope::authorizeUserOwned($article, $request);
        $article->delete();

        return response()->json(['success' => true, 'message' => 'Article deleted.']);
    }
}
