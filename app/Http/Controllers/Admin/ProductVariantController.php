<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductVariantController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:products.update')->only(['store', 'update', 'destroy']);
    }

    public function store(Request $request, Product $product)
    {
        $validated = $request->validate([
            'sku' => ['nullable', 'string', 'max:80', 'unique:product_variants,sku'],
            'variant_key' => ['nullable', 'string', 'max:255'],
            'price' => ['nullable', 'numeric'],
            'compare_at' => ['nullable', 'numeric'],
            'stock' => ['nullable', 'integer'],
            'weight' => ['nullable', 'numeric'],
            'length' => ['nullable', 'numeric'],
            'width' => ['nullable', 'numeric'],
            'height' => ['nullable', 'numeric'],
            'is_active' => ['boolean'],
        ]);
        $variant = $product->variants()->create($validated);
        return response()->json(['success' => true, 'data' => $variant], 201);
    }

    public function update(Request $request, Product $product, ProductVariant $variant)
    {
        if ($variant->product_id !== $product->id) {
            abort(404);
        }
        $validated = $request->validate([
            'sku' => ['sometimes', 'nullable', 'string', 'max:80', Rule::unique('product_variants', 'sku')->ignore($variant->id)],
            'variant_key' => ['nullable', 'string', 'max:255'],
            'price' => ['nullable', 'numeric'],
            'compare_at' => ['nullable', 'numeric'],
            'stock' => ['nullable', 'integer'],
            'weight' => ['nullable', 'numeric'],
            'length' => ['nullable', 'numeric'],
            'width' => ['nullable', 'numeric'],
            'height' => ['nullable', 'numeric'],
            'is_active' => ['boolean'],
        ]);
        $variant->update($validated);
        return response()->json(['success' => true, 'data' => $variant]);
    }

    public function destroy(Product $product, ProductVariant $variant)
    {
        if ($variant->product_id !== $product->id) {
            abort(404);
        }
        $variant->delete();
        return response()->json(['success' => true]);
    }
}
