<?php

namespace App\Http\Controllers\Api\Milestone2;

use App\Jobs\SendOrderPlacementNotificationsJob;
use App\Models\Address;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Http\Controllers\AppBaseController;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * @group Milestone-2: Checkout APIs
 */
class CheckoutController extends AppBaseController
{
    /**
     * List Addresses
     *
     * @authenticated
     *
     * @response 200 {
     *   "success": true,
     *   "message": "Addresses retrieved",
     *   "data": [
     *     {
     *       "id": 1,
     *       "title": "Home",
     *       "address_line_1": "123 Main St",
     *       "city": "Lahore",
     *       "is_default": true
     *     }
     *   ]
     * }
     */
    public function listAddresses()
    {
        $addresses = auth()->user()->addresses()->latest()->get();
        return $this->successResponse($addresses, 'Addresses retrieved');
    }

    /**
     * Add Address
     *
     * @authenticated
     * @bodyParam title string required Address title (Home/Work). Example: Home
     * @bodyParam name string Recipient name. Example: John Doe
     * @bodyParam phone string Contact number. Example: +923001234567
     * @bodyParam address_line_1 string required The address. Example: 123 Main St
     * @bodyParam address_line_2 string Secondary address info. Example: Apartment 4B
     * @bodyParam city string required The city. Example: Lahore
     * @bodyParam state string Province or state. Example: Punjab
     * @bodyParam postal_code string Postal/Zip code. Example: 54000
     * @bodyParam is_default boolean Whether to set as default. Example: true
     *
     * @response 201 {
     *   "success": true,
     *   "message": "Address added",
     *   "data": { "id": 1 }
     * }
     */
    public function storeAddress(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:50',
            'name' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'address_line_1' => 'required|string',
            'address_line_2' => 'nullable|string',
            'city' => 'required|string',
            'state' => 'nullable|string',
            'postal_code' => 'nullable|string',
            'is_default' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first());
        }

        $userId = auth()->id();
        $isDefault = $request->boolean('is_default');

        if ($isDefault) {
            Address::where('user_id', $userId)->update(['is_default' => false]);
        }

        $address = Address::create(array_merge($request->all(), ['user_id' => $userId]));

        return $this->successResponse(['id' => $address->id], 'Address added', 201);
    }

    /**
     * Update Address
     *
     * @authenticated
     * @urlParam id integer required Address ID. Example: 1
     *
     * @response 200 {
     *   "success": true,
     *   "message": "Address updated"
     * }
     */
    public function updateAddress(Request $request, $id)
    {
        $address = auth()->user()->addresses()->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'nullable|string|max:50',
            'address_line_1' => 'nullable|string',
            'city' => 'nullable|string',
            'is_default' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first());
        }

        if ($request->boolean('is_default')) {
            Address::where('user_id', auth()->id())->update(['is_default' => false]);
        }

        $address->update($request->all());

        return $this->successResponse(null, 'Address updated');
    }

    /**
     * Delete Address
     *
     * @authenticated
     * @urlParam id integer required Address ID. Example: 1
     *
     * @response 200 {
     *   "success": true,
     *   "message": "Address deleted"
     * }
     */
    public function deleteAddress($id)
    {
        $address = auth()->user()->addresses()->findOrFail($id);
        $address->delete();

        return $this->successResponse(null, 'Address deleted');
    }

    /**
     * Place Order
     *
     * Create a new order with COD.
     *
     * @authenticated
     * @bodyParam address_id integer required Shipping address ID. Example: 1
     * @bodyParam special_instructions string Special instructions for delivery. Example: Deliver after 5pm
     * @bodyParam payment_method string required Only 'cod' is supported now. Example: cod
     *
     * @response 201 {
     *   "success": true,
     *   "message": "Order placed successfully",
     *   "data": {
     *     "order_id": 1,
     *     "order_number": "ORD-2026-0412-ABC",
     *     "status": "pending",
     *     "items": [
     *       {
     *         "id": 1,
     *         "product_id": 101,
     *         "product_name": "Product Name",
     *         "sku": "SKU-123",
     *         "quantity": 2,
     *         "unit_price": 10.5,
     *         "subtotal": 21.0,
     *         "feature_image": "images/p101.png"
     *       }
     *     ],
     *     "price_breakdown": {
     *       "subtotal": 21.0,
     *       "tax": 0.0,
     *       "delivery": 10.0,
     *       "total": 31.0,
     *       "currency": "PKR"
     *     },
     *     "shipping_address": {
     *       "id": 1,
     *       "title": "Home",
     *       "name": "John Doe",
     *       "phone": "+923001234567",
     *       "address_line_1": "123 Main St",
     *       "city": "Lahore"
     *     },
     *     "payment_method": "Cash on Delivery (COD)",
     *     "notes": "Deliver after 5pm",
     *     "created_at": "2026-04-12T12:00:00.000000Z"
     *   }
     * }
     */
    public function placeOrder(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'address_id' => 'required|exists:addresses,id,user_id,' . auth()->id(),
            'special_instructions' => 'nullable|string',
            'payment_method' => 'required|in:cod',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first());
        }

        $user = auth()->user();
        $cartItems = $user->cartItems()->where('is_saved_for_later', false)->with('product')->get();

        if ($cartItems->isEmpty()) {
            return $this->errorResponse('Your cart is empty.');
        }

        // Validate stock
        foreach ($cartItems as $item) {
            if ($item->product->stock < $item->quantity) {
                return $this->errorResponse("Product '{$item->product->name}' is out of stock.");
            }
        }

        // Create order in a transaction; notifications are sent after commit
        $order = DB::transaction(function () use ($user, $cartItems, $request) {
            $subtotal = 0;
            foreach ($cartItems as $item) {
                $subtotal += $item->product->price * $item->quantity;
            }

            $tax = 0;
            $delivery = 10.0;
            $total = $subtotal + $tax + $delivery;

            $order = Order::create([
                'user_id' => $user->id,
                'code' => 'ORD-' . strtoupper(Str::random(12)),
                'status' => 'pending',
                'shipping_address_id' => $request->address_id,
                'currency' => 'PKR',
                'subtotal' => $subtotal,
                'shipping_cost' => $delivery,
                'tax_total' => $tax,
                'grand_total' => $total,
                'payment_status' => 'unpaid',
                'notes' => $request->special_instructions,
            ]);

            foreach ($cartItems as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'store_id' => $item->product->store_id,
                    'product_id' => $item->product->id,
                    'name' => $item->product->name,
                    'sku' => $item->product->sku,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->product->price,
                    'subtotal' => $item->product->price * $item->quantity,
                    'status' => 'pending',
                ]);

                $item->product->decrement('stock', $item->quantity);
            }

            Payment::create([
                'order_id' => $order->id,
                'method' => 'cod',
                'amount' => $total,
                'status' => 'initiated',
            ]);

            $user->cartItems()->where('is_saved_for_later', false)->delete();

            return $order;
        });

        // Load relationships for response
        $order->load(['items.product', 'shippingAddress', 'payments']);

        SendOrderPlacementNotificationsJob::dispatch($order->id, $user->id);

        return $this->successResponse([
            'order_id' => $order->id,
            'order_number' => $order->code,
            'status' => $order->status,
            'items' => $order->items->map(fn ($item) => [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'product_name' => $item->name,
                'sku' => $item->sku,
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
                'subtotal' => $item->subtotal,
                'feature_image' => $item->product?->feature_image,
            ]),
            'price_breakdown' => [
                'subtotal' => $order->subtotal,
                'tax' => $order->tax_total,
                'delivery' => $order->shipping_cost,
                'total' => $order->grand_total,
                'currency' => $order->currency,
            ],
            'shipping_address' => $order->shippingAddress ? [
                'id' => $order->shippingAddress->id,
                'title' => $order->shippingAddress->title,
                'name' => $order->shippingAddress->name,
                'phone' => $order->shippingAddress->phone,
                'address_line_1' => $order->shippingAddress->address_line_1,
                'city' => $order->shippingAddress->city,
            ] : null,
            'payment_method' => 'Cash on Delivery (COD)',
            'notes' => $order->notes,
            'created_at' => $order->created_at,
        ], 'Order placed successfully', 201);
    }
}
