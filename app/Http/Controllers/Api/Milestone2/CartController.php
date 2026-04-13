<?php

namespace App\Http\Controllers\Api\Milestone2;

use App\Http\Controllers\AppBaseController;
use App\Models\CartItem;
use App\Models\Message;
use App\Models\Product;
use App\Models\UnavailabilityDuration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * @group Milestone-2: Cart APIs
 */
class CartController extends AppBaseController
{
    /**
     * View Cart Items
     *
     * @authenticated
     *
     * @response 200 {
     *   "success": true,
     *   "message": "Cart items retrieved",
     *   "data": {
     *     "items": [
     *       {
     *         "id": 1,
     *         "product": {
     *           "id": 101,
     *           "name": "Product Name",
     *           "price": 10.5,
     *           "feature_image": "images/p101.png"
     *         },
     *         "quantity": 2,
     *         "is_saved_for_later": false
     *       }
     *     ],
     *     "price_breakdown": {
     *       "subtotal": 21.0,
     *       "tax": 0.0,
     *       "delivery": 5.0,
     *       "total": 26.0
     *     },
     *     "notifications": {
     *       "unreplied_chats": 2,
     *       "store_unavailability": [
     *         {
     *           "store_name": "Ali Store",
     *           "reason": "Holiday",
     *           "end_at": "2026-04-15T00:00:00.000000Z"
     *         }
     *       ]
     *     }
     *   }
     * }
     */
    public function index()
    {
        $user = auth()->user();
        $cartItems = $user->cartItems()->with('product.store')->get();

        $subtotal = 0;
        $items = $cartItems->map(function ($item) use (&$subtotal) {
            if (!$item->is_saved_for_later) {
                $subtotal += $item->product->price * $item->quantity;
            }
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
                ],
                'quantity' => $item->quantity,
                'is_saved_for_later' => $item->is_saved_for_later,
            ];
        });

        $tax = 0; // Simplified
        $delivery = $subtotal > 0 ? 10.0 : 0.0; // Simplified
        $total = $subtotal + $tax + $delivery;

        // Unreplied chats count
        $unrepliedChats = Message::where('receiver_id', $user->id)
            ->where('is_read', false)
            ->count();

        // Store unavailability notifications for stores in cart
        $storeIds = $cartItems->pluck('product.store_id')->unique();
        $unavailability = UnavailabilityDuration::whereIn('store_id', $storeIds)
            ->where('end_at', '>', now())
            ->with('store:id,name')
            ->get()
            ->map(function ($u) {
                return [
                    'store_name' => $u->store->name,
                    'reason' => $u->reason,
                    'end_at' => $u->end_at,
                ];
            });

        return $this->successResponse([
            'items' => $items,
            'price_breakdown' => [
                'subtotal' => $subtotal,
                'tax' => $tax,
                'delivery' => $delivery,
                'total' => $total,
            ],
            'notifications' => [
                'unreplied_chats' => $unrepliedChats,
                'store_unavailability' => $unavailability,
            ]
        ], 'Cart items retrieved');
    }

    /**
     * Add Item to Cart
     *
     * @authenticated
     * @bodyParam product_id integer required The product ID. Example: 101
     * @bodyParam quantity integer The quantity. Example: 1
     *
     * @response 201 {
     *   "success": true,
     *   "message": "Item added to cart",
     *   "data": { "id": 1, "quantity": 1 }
     * }
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'quantity' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first());
        }

        $product = Product::findOrFail($request->product_id);
        
        // Stock validation
        if ($product->stock < ($request->quantity ?? 1)) {
            return $this->errorResponse('Requested quantity exceeds available stock.');
        }

        $cartItem = CartItem::updateOrCreate(
            ['user_id' => auth()->id(), 'product_id' => $request->product_id],
            ['quantity' => $request->quantity ?? 1, 'is_saved_for_later' => false]
        );

        return $this->successResponse([
            'id' => $cartItem->id,
            'quantity' => $cartItem->quantity,
        ], 'Item added to cart', 201);
    }

    /**
     * Update Cart Item
     *
     * @authenticated
     * @urlParam id integer required Cart item ID. Example: 1
     * @bodyParam quantity integer required The quantity. Example: 2
     *
     * @response 200 {
     *   "success": true,
     *   "message": "Cart item updated"
     * }
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first());
        }

        $cartItem = auth()->user()->cartItems()->findOrFail($id);
        
        // Stock validation
        if ($cartItem->product->stock < $request->quantity) {
            return $this->errorResponse('Requested quantity exceeds available stock.');
        }

        $cartItem->update(['quantity' => $request->quantity]);

        return $this->successResponse(null, 'Cart item updated');
    }

    /**
     * Remove Item from Cart
     *
     * @authenticated
     * @urlParam id integer required Cart item ID. Example: 1
     *
     * @response 200 {
     *   "success": true,
     *   "message": "Item removed from cart"
     * }
     */
    public function destroy($id)
    {
        $cartItem = auth()->user()->cartItems()->findOrFail($id);
        $cartItem->delete();

        return $this->successResponse(null, 'Item removed from cart');
    }

    /**
     * Save Item for Later
     *
     * @authenticated
     * @urlParam id integer required Cart item ID. Example: 1
     * @bodyParam is_saved boolean required Whether to save for later. Example: true
     *
     * @response 200 {
     *   "success": true,
     *   "message": "Cart item status updated"
     * }
     */
    public function saveForLater(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'is_saved' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first());
        }

        $cartItem = auth()->user()->cartItems()->findOrFail($id);
        $cartItem->update(['is_saved_for_later' => $request->is_saved]);

        return $this->successResponse(null, 'Cart item status updated');
    }

    /**
     * Checkout Validation
     *
     * Validate stock and availability before proceeding.
     *
     * @authenticated
     *
     * @response 200 {
     *   "success": true,
     *   "message": "Validation successful"
     * }
     */
    public function validateCheckout()
    {
        $cartItems = auth()->user()->cartItems()->where('is_saved_for_later', false)->with('product.store')->get();

        if ($cartItems->isEmpty()) {
            return $this->errorResponse('Your cart is empty.');
        }

        foreach ($cartItems as $item) {
            if ($item->product->stock < $item->quantity) {
                return $this->errorResponse("Product '{$item->product->name}' is out of stock.");
            }
            
            // Store unavailability check
            $unavailability = UnavailabilityDuration::where('store_id', $item->product->store_id)
                ->where('start_at', '<=', now())
                ->where('end_at', '>=', now())
                ->first();
            
            if ($unavailability) {
                return $this->errorResponse("Store '{$item->product->store->name}' is currently unavailable until {$unavailability->end_at}.");
            }
        }

        return $this->successResponse(null, 'Validation successful');
    }

    /**
     * Clear Cart
     *
     * @authenticated
     *
     * @response 200 {
     *   "success": true,
     *   "message": "Cart cleared"
     * }
     */
    public function clear()
    {
        auth()->user()->cartItems()->where('is_saved_for_later', false)->delete();
        return $this->successResponse(null, 'Cart cleared');
    }
}
