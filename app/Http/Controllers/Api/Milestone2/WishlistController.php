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
        $wishlistItems = auth()->user()->wishlistItems()->with('product.store')->get();

        $items = $wishlistItems->map(function ($item) {
            return [
                'id' => $item->id,
                'product' => [
                    'id' => $item->product->id,
                    'name' => $item->product->name,
                    'price' => $item->product->price,
                    'feature_image' => $item->product->feature_image,
                    'store' => [
                        'id' => $item->product->store->id,
                        'name' => $item->product->store->name,
                    ]
                ]
            ];
        });

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
            'product_id' => 'required|exists:products,id',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first());
        }

        $userId = auth()->id();
        $productId = $request->product_id;

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
        $wishlistItem = auth()->user()->wishlistItems()->findOrFail($id);
        $productId = $wishlistItem->product_id;

        // Create or update cart item
        CartItem::updateOrCreate(
            ['user_id' => auth()->id(), 'product_id' => $productId],
            ['quantity' => 1, 'is_saved_for_later' => false]
        );

        // Delete wishlist item
        $wishlistItem->delete();

        return $this->successResponse(null, 'Product moved to cart');
    }
}
