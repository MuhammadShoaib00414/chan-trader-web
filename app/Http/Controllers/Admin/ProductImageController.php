<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;

class ProductImageController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:products.update')->only(['store', 'destroy', 'primary']);
    }

    public function store(Request $request, Product $product)
    {
        $validated = $request->validate([
            'path' => ['nullable', 'string', 'max:255'],
            'file' => ['nullable', 'image', 'max:5120'],
            'alt' => ['nullable', 'string', 'max:150'],
            'sort_order' => ['nullable', 'integer'],
            'is_primary' => ['boolean'],
        ]);
        if ($request->hasFile('file')) {
            $path = $request->file('file')->storePublicly("products/{$product->id}", ['disk' => 'public']);
            $validated['path'] = "/storage/{$path}";
        }
        if (empty($validated['path'])) {
            abort(422, 'Either path or file is required.');
        }
        $image = $product->images()->create([
            'path' => $validated['path'],
            'alt' => $validated['alt'] ?? null,
            'sort_order' => $validated['sort_order'] ?? 0,
            'is_primary' => (bool) ($validated['is_primary'] ?? false),
        ]);

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
