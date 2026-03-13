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
        $rules = [
            'name' => ['required', 'string', 'max:120', 'unique:brands,name'],
            'slug' => ['required', 'string', 'max:140', 'unique:brands,slug'],
            'sort_order' => ['nullable', 'integer'],
            'description' => ['nullable', 'string'],
        ];
        $rules['logo'] = $request->hasFile('logo')
            ? ['nullable', 'file', 'mimes:png,jpg,jpeg,svg', 'max:2048']
            : ['nullable', 'string', 'max:255'];
        $validated = $request->validate($rules);
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('brand-logos', 'public');
            $validated['logo'] = $path;
        }
        if (! array_key_exists('sort_order', $validated) || $validated['sort_order'] === null) {
            $validated['sort_order'] = (Brand::max('sort_order') ?? 0) + 1;
        }
        $brand = Brand::create($validated);

        return response()->json(['success' => true, 'message' => 'Brand created.', 'data' => $brand], 201);
    }

    public function show(Brand $brand)
    {
        return response()->json(['success' => true, 'data' => $brand]);
    }

    public function update(Request $request, Brand $brand)
    {
        $rules = [
            'name' => ['sometimes', 'string', 'max:120', Rule::unique('brands', 'name')->ignore($brand->id)],
            'slug' => ['sometimes', 'string', 'max:140', Rule::unique('brands', 'slug')->ignore($brand->id)],
            'sort_order' => ['nullable', 'integer'],
            'description' => ['nullable', 'string'],
        ];
        $rules['logo'] = $request->hasFile('logo')
            ? ['nullable', 'file', 'mimes:png,jpg,jpeg,svg', 'max:2048']
            : ['nullable', 'string', 'max:255'];
        $validated = $request->validate($rules);
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('brand-logos', 'public');
            $validated['logo'] = $path;
        }
        $brand->update($validated);

        return response()->json(['success' => true, 'message' => 'Brand updated.', 'data' => $brand]);
    }

    public function destroy(Brand $brand)
    {
        $brand->delete();

        return response()->json(['success' => true, 'message' => 'Brand deleted.']);
    }
}
