<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
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
            'icon' => ['nullable', 'string', 'max:120'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['boolean'],
        ]);
        $category = Category::create($validated);
        return response()->json(['success' => true, 'data' => $category], 201);
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
            'icon' => ['nullable', 'string', 'max:120'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['boolean'],
        ]);
        $category->update($validated);
        return response()->json(['success' => true, 'data' => $category]);
    }

    public function destroy(Category $category)
    {
        $category->delete();
        return response()->json(['success' => true]);
    }
}
