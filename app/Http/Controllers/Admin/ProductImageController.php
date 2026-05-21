<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use App\Support\ResizedImageStore;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
            'files.*' => ['file', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
            'file'    => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
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
            $path = ResizedImageStore::store($file, "products/{$product->id}/gallery");
            $images[] = $product->images()->create([
                'path'       => ResizedImageStore::publicUrl($path),
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

        DB::transaction(function () use ($product, $image) {
            $wasPrimary = (bool) $image->is_primary;
            ResizedImageStore::deletePublicPath($image->path);
            $image->delete();

            if ($wasPrimary) {
                $nextImage = ProductImage::query()
                    ->where('product_id', $product->id)
                    ->orderBy('sort_order')
                    ->orderBy('id')
                    ->first();

                if ($nextImage) {
                    $nextImage->update(['is_primary' => true]);
                }
            }
        });

        return response()->json(['success' => true, 'message' => 'Gallery image deleted.']);
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
