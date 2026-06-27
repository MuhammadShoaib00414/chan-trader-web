<?php

namespace App\Http\Controllers\Admin;

use App\Api\SubcategoryApi;
use App\Http\Controllers\Controller;
use App\Models\Subcategory;
use App\Support\VendorCatalogScope;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SubcategoryController extends Controller
{
    public function __construct(public SubcategoryApi $subcategories)
    {
        $this->middleware('permission:subcategories.manage')->only(['index', 'store', 'show', 'update', 'destroy']);
    }

    public function index(Request $request)
    {
        $items = $this->subcategories->listForAdmin(
            $request->only(['q', 'category_id', 'sort_by', 'sort_dir']),
            VendorCatalogScope::vendorUserId($request)
        );

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
        $validated = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['required', 'string', 'max:140', 'unique:subcategories,slug'],
            'image' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp,svg', 'max:4096'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['boolean'],
        ]);

        VendorCatalogScope::authorizeCategoryOwned($request, (int) $validated['category_id']);
        $validated = VendorCatalogScope::assignUserId($validated, $request);
        $subcategory = $this->subcategories->create($validated);

        return response()->json(['success' => true, 'message' => 'Subcategory created.', 'data' => $subcategory], 201);
    }

    public function show(Subcategory $subcategory, Request $request)
    {
        VendorCatalogScope::authorizeUserOwned($subcategory, $request);
        $subcategory->load('category:id,name');

        return response()->json(['success' => true, 'data' => $subcategory]);
    }

    public function update(Request $request, Subcategory $subcategory)
    {
        VendorCatalogScope::authorizeUserOwned($subcategory, $request);
        $validated = $request->validate([
            'category_id' => ['sometimes', 'exists:categories,id'],
            'name' => ['sometimes', 'string', 'max:120'],
            'slug' => ['sometimes', 'string', 'max:140', Rule::unique('subcategories', 'slug')->ignore($subcategory->id)],
            'image' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp,svg', 'max:4096'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['boolean'],
        ]);

        if (array_key_exists('category_id', $validated)) {
            VendorCatalogScope::authorizeCategoryOwned($request, (int) $validated['category_id']);
        }

        $subcategory = $this->subcategories->update($subcategory, $validated);

        return response()->json(['success' => true, 'message' => 'Subcategory updated.', 'data' => $subcategory]);
    }

    public function destroy(Subcategory $subcategory, Request $request)
    {
        VendorCatalogScope::authorizeUserOwned($subcategory, $request);
        $subcategory->delete();

        return response()->json(['success' => true, 'message' => 'Subcategory deleted.']);
    }
}
