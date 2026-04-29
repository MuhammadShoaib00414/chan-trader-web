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
            'files'   => ['nullable', 'array', 'max:10'],
            'files.*' => ['image', 'max:5120'],
            'file'    => ['nullable', 'image', 'max:5120'],
            'paths'   => ['nullable', 'array', 'max:10'],
            'paths.*' => ['string', 'max:255'],
            'path'    => ['nullable', 'string', 'max:255'],
            'alt'        => ['nullable', 'string', 'max:150'],
            'sort_order' => ['nullable', 'integer'],
            'is_primary' => ['boolean'],
        ]);

        // Normalise single file/path into arrays
        $files = $request->file('files') ?? ($request->hasFile('file') ? [$request->file('file')] : []);
        $paths = $validated['paths'] ?? (isset($validated['path']) ? [$validated['path']] : []);

        $images = [];

        foreach ($files as $index => $file) {
            $path = $file->storePublicly("products/{$product->id}", ['disk' => 'public']);
            $images[] = $product->images()->create([
                'path'       => "/storage/{$path}",
                'alt'        => $validated['alt'] ?? null,
                'sort_order' => ($validated['sort_order'] ?? 0) + $index,
                'is_primary' => $index === 0 && !ProductImage::where('product_id', $product->id)->exists()
                    ? true
                    : (bool) ($validated['is_primary'] ?? false),
            ]);
        }

        foreach ($paths as $index => $path) {
            $images[] = $product->images()->create([
                'path'       => $path,
                'alt'        => $validated['alt'] ?? null,
                'sort_order' => ($validated['sort_order'] ?? 0) + $index,
                'is_primary' => $index === 0 && !ProductImage::where('product_id', $product->id)->exists()
                    ? true
                    : (bool) ($validated['is_primary'] ?? false),
            ]);
        }

        if (empty($images)) {
            abort(422, 'Either files or paths are required.');
        }

        return response()->json(['success' => true, 'data' => $images], 201);
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
