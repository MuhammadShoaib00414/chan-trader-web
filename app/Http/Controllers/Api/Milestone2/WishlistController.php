<?php

namespace App\Http\Controllers\Api\Milestone2;

use App\Http\Controllers\AppBaseController;
use App\Models\CartItem;
use App\Models\WishlistItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * @group Milestone-2: Wishlist APIs
 */
class WishlistController extends AppBaseController
{
    /**
     * View Wishlist
     *
     * @authenticated
     *
     * @response 200 {
     *   "success": true,
     *   "message": "Wishlist items retrieved",
     *   "data": {
     *     "items": [
     *       {
     *         "id": 1,
     *         "product": {
     *           "id": 101,
     *           "name": "Product Name",
     *           "price": 10.5,
     *           "feature_image": "images/p101.png"
     *         }
     *       }
     *     ]
     *   }
     * }
     */
    public function index()
    {
        $wishlistItems = auth()->user()->wishlistItems()
            ->with([
                'product' => fn ($query) => $query->withTrashed()->with([
                    'store' => fn ($storeQuery) => $storeQuery->withTrashed(),
                ]),
            ])
            ->latest()
            ->get();

        $staleItemIds = [];

        $items = $wishlistItems->map(function ($item) use (&$staleItemIds) {
            $product = $item->product;

            if (! $product || $product->trashed() || ! $product->is_published) {
                $staleItemIds[] = $item->id;

                return null;
            }

            return [
                'id' => $item->id,
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'price' => $product->price,
                    'compare_at' => $product->compare_at,
                    'discountedPrice' => $product->discounted_price,
                    'feature_image' => $product->feature_image,
                    'is_published' => $product->is_published,
                    'store' => $product->store ? [
                        'id' => $product->store->id,
                        'name' => $product->store->name,
                    ] : null,
                ],
            ];
        })->filter()->values();

        if ($staleItemIds !== []) {
            WishlistItem::whereIn('id', $staleItemIds)->delete();
        }

        return $this->successResponse(['items' => $items], 'Wishlist items retrieved');
    }

    /**
     * Toggle Wishlist Item
     *
     * @authenticated
     * @bodyParam product_id integer required The product ID. Example: 101
     *
     * @response 200 {
     *   "success": true,
     *   "message": "Product added to wishlist",
     *   "data": { "is_wishlisted": true }
     * }
     */
    public function toggle(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first());
        }

        $userId = auth()->id();
        $productId = (int) $request->product_id;

        $product = Product::query()
            ->whereKey($productId)
            ->where('is_published', true)
            ->first();

        if (! $product) {
            return $this->errorResponse('Product not found or not available', 404);
        }

        $wishlistItem = WishlistItem::where('user_id', $userId)->where('product_id', $productId)->first();

        if ($wishlistItem) {
            $wishlistItem->delete();
            return $this->successResponse(['is_wishlisted' => false], 'Product removed from wishlist');
        } else {
            WishlistItem::create(['user_id' => $userId, 'product_id' => $productId]);
            return $this->successResponse(['is_wishlisted' => true], 'Product added to wishlist');
        }
    }

    /**
     * Move to Cart
     *
     * Move a wishlist item to the shopping cart.
     *
     * @authenticated
     * @urlParam id integer required Wishlist item ID. Example: 1
     *
     * @response 200 {
     *   "success": true,
     *   "message": "Product moved to cart"
     * }
     */
    public function moveToCart($id)
    {
        $wishlistItem = auth()->user()->wishlistItems()
            ->with([
                'product' => fn ($query) => $query->withTrashed(),
            ])
            ->findOrFail($id);

        $product = $wishlistItem->product;

        if (! $product || $product->trashed() || ! $product->is_published) {
            $wishlistItem->delete();

            return $this->errorResponse('Product is no longer available.', 404);
        }

        if ($product->stock !== null && $product->stock < 1) {
            return $this->errorResponse('Product is out of stock.');
        }

        // Create or update cart item
        CartItem::updateOrCreate(
            ['user_id' => auth()->id(), 'product_id' => $product->id],
            ['quantity' => 1, 'is_saved_for_later' => false]
        );

        // Delete wishlist item
        $wishlistItem->delete();

        return $this->successResponse(null, 'Product moved to cart');
    }
}
