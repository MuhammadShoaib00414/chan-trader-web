<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductAttribute;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductAttributeController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:products.update')->only(['store', 'update', 'destroy']);
    }

    public function store(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'value' => ['required', 'string', 'max:160'],
            'unit' => ['nullable', 'string', 'max:32'],
        ]);
        $attr = $product->attributes()->create($validated);

        return response()->json(['success' => true, 'data' => $attr], 201);
    }

    public function update(Request $request, Product $product, ProductAttribute $attribute)
    {
        if ($attribute->product_id !== $product->id) {
            abort(404);
        }
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:80', Rule::unique('product_attributes', 'name')->ignore($attribute->id)->where('product_id', $product->id)],
            'value' => ['sometimes', 'string', 'max:160'],
            'unit' => ['nullable', 'string', 'max:32'],
        ]);
        $attribute->update($validated);

        return response()->json(['success' => true, 'data' => $attribute]);
    }

    public function destroy(Product $product, ProductAttribute $attribute)
    {
        if ($attribute->product_id !== $product->id) {
            abort(404);
        }
        $attribute->delete();

        return response()->json(['success' => true]);
    }
}
