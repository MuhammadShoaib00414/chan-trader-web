<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;

class ProductImageController extends Controller
{
    public function store(Request $request, Product $product)
    {
        $validated = $request->validate([
            'path' => ['required', 'string', 'max:255'],
            'alt' => ['nullable', 'string', 'max:150'],
            'sort_order' => ['nullable', 'integer'],
            'is_primary' => ['boolean'],
        ]);
        $image = $product->images()->create($validated);
        return response()->json(['success' => true, 'data' => $image], 201);
    }

    public function destroy(Product $product, ProductImage $image)
    {
        if ($image->product_id !== $product->id) {
            abort(404);
        }
        $image->delete();
        return response()->json(['success' => true]);
    }

    public function primary(Product $product, ProductImage $image)
    {
        if ($image->product_id !== $product->id) {
            abort(404);
        }
        \DB::transaction(function () use ($product, $image) {
            \App\Models\ProductImage::where('product_id', $product->id)->update(['is_primary' => false]);
            $image->update(['is_primary' => true]);
        });
        return response()->json(['success' => true, 'data' => $image->fresh()]);
    }
}
