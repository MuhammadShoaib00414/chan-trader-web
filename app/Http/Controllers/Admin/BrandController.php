<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BrandController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:brands.manage')->only(['index', 'store', 'show', 'update', 'destroy']);
    }

    /**
     * List brands (filterable)
     *
     * @group Admin Brands
     *
     * @queryParam q string Search by brand name (partial match). Example: texas
     * @queryParam page integer Page number for pagination. Example: 1
     *
     * @response 200 scenario="success" {
     *   "success": true,
     *   "data": [
     *     {
     *       "id": 5,
     *       "name": "Texas Instruments",
     *       "slug": "texas-instruments",
     *       "logo": "logos/ti.png"
     *     }
     *   ],
     *   "pagination": {
     *     "total": 42,
     *     "per_page": 20,
     *     "current_page": 1,
     *     "last_page": 3
     *   }
     * }
     *
     * @authenticated
     */
    public function index(Request $request)
    {
        $query = Brand::query();
        if ($request->filled('q')) {
            $q = $request->string('q')->toString();
            $query->where('name', 'like', "%{$q}%");
        }
        $brands = $query->orderBy('name')->paginate(20);
        return response()->json(['success' => true, 'data' => $brands->items(), 'pagination' => [
            'total' => $brands->total(),
            'per_page' => $brands->perPage(),
            'current_page' => $brands->currentPage(),
            'last_page' => $brands->lastPage(),
        ]]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120', 'unique:brands,name'],
            'slug' => ['required', 'string', 'max:140', 'unique:brands,slug'],
            'logo' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);
        $brand = Brand::create($validated);
        return response()->json(['success' => true, 'data' => $brand], 201);
    }

    public function show(Brand $brand)
    {
        return response()->json(['success' => true, 'data' => $brand]);
    }

    public function update(Request $request, Brand $brand)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:120', Rule::unique('brands', 'name')->ignore($brand->id)],
            'slug' => ['sometimes', 'string', 'max:140', Rule::unique('brands', 'slug')->ignore($brand->id)],
            'logo' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);
        $brand->update($validated);
        return response()->json(['success' => true, 'data' => $brand]);
    }

    public function destroy(Brand $brand)
    {
        $brand->delete();
        return response()->json(['success' => true]);
    }
}
