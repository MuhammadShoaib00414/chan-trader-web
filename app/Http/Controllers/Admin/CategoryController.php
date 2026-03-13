<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:categories.manage')->only(['index', 'store', 'show', 'update', 'destroy']);
    }

    /**
     * List categories (filterable)
     *
     * @group Admin Categories
     *
     * @queryParam q string Search by category name (partial match). Example: capacitors
     * @queryParam page integer Page number for pagination. Example: 3
     *
     * @response 200 scenario="success" {
     *   "success": true,
     *   "data": [
     *     {
     *       "id": 9,
     *       "name": "Capacitors",
     *       "slug": "capacitors",
     *       "icon": "icons/capacitor.svg",
     *       "sort_order": 20,
     *       "is_active": true
     *     }
     *   ],
     *   "pagination": {
     *     "total": 18,
     *     "per_page": 20,
     *     "current_page": 1,
     *     "last_page": 1
     *   }
     * }
     *
     * @authenticated
     */
    public function index(Request $request)
    {
        $query = Category::query();
        if ($request->filled('q')) {
            $q = $request->string('q')->toString();
            $query->where('name', 'like', "%{$q}%");
        }
        $categories = $query->orderBy('sort_order')->orderBy('name')->paginate(20);

        return response()->json(['success' => true, 'data' => $categories->items(), 'pagination' => [
            'total' => $categories->total(),
            'per_page' => $categories->perPage(),
            'current_page' => $categories->currentPage(),
            'last_page' => $categories->lastPage(),
        ]]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'parent_id' => ['nullable', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['required', 'string', 'max:140', 'unique:categories,slug'],
            'image' => ['nullable', 'file', 'mimes:png,jpg,jpeg,svg', 'max:2048'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['boolean'],
        ]);
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('category-images', 'public');
            $validated['image'] = $path;
        } elseif ($request->hasFile('icon')) {
            $path = $request->file('icon')->store('category-images', 'public');
            $validated['image'] = $path;
        }
        if (! array_key_exists('sort_order', $validated) || $validated['sort_order'] === null) {
            $validated['sort_order'] = (Category::max('sort_order') ?? 0) + 1;
        }
        $category = Category::create($validated);

        return response()->json(['success' => true, 'message' => 'Category created.', 'data' => $category], 201);
    }

    public function show(Category $category)
    {
        return response()->json(['success' => true, 'data' => $category]);
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'parent_id' => ['nullable', 'exists:categories,id'],
            'name' => ['sometimes', 'string', 'max:120'],
            'slug' => ['sometimes', 'string', 'max:140', Rule::unique('categories', 'slug')->ignore($category->id)],
            'image' => ['nullable', 'file', 'mimes:png,jpg,jpeg,svg', 'max:2048'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['boolean'],
        ]);
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('category-images', 'public');
            $validated['image'] = $path;
        } elseif ($request->hasFile('icon')) {
            $path = $request->file('icon')->store('category-images', 'public');
            $validated['image'] = $path;
        }
        $category->update($validated);

        return response()->json(['success' => true, 'message' => 'Category updated.', 'data' => $category]);
    }

    public function destroy(Category $category)
    {
        $category->delete();

        return response()->json(['success' => true, 'message' => 'Category deleted.']);
    }
}
