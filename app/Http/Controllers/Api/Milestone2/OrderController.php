<?php

namespace App\Http\Controllers\Api\Milestone2;

use App\Http\Controllers\AppBaseController;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

/**
 * @group Milestone-2: Order APIs
 */
class OrderController extends AppBaseController
{
    /**
     * View Past Orders
     *
     * @authenticated
     * @queryParam status string Filter by status (pending, delivered, cancelled). Example: pending
     *
     * @response 200 {
     *   "success": true,
     *   "message": "Orders retrieved",
     *   "data": [
     *     {
     *       "id": 1,
     *       "code": "ORD-ABC-123",
     *       "status": "pending",
     *       "grand_total": 26.0,
     *       "created_at": "2026-04-12T12:00:00.000000Z"
     *     }
     *   ]
     * }
     */
    public function index(Request $request)
    {
        $query = auth()->user()->orders()->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $orders = $query->paginate(10);

        return $this->successResponse([
            'items' => $orders->getCollection()->map(function ($order) {
                return [
                    'id' => $order->id,
                    'code' => $order->code,
                    'status' => $order->status,
                    'grand_total' => $order->grand_total,
                    'created_at' => $order->created_at,
                ];
            }),
            'pagination' => [
                'total' => $orders->total(),
                'per_page' => $orders->perPage(),
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
            ]
        ], 'Orders retrieved');
    }

    /**
     * Get Order Details
     *
     * @authenticated
     * @urlParam id integer required Order ID. Example: 1
     *
     * @response 200 {
     *   "success": true,
     *   "message": "Order details retrieved",
     *   "data": {
     *     "id": 1,
     *     "code": "ORD-ABC-123",
     *     "status": "pending",
     *     "items": [
     *       {
     *         "id": 1,
     *         "product_name": "Product Name",
     *         "quantity": 2,
     *         "subtotal": 21.0
     *       }
     *     ],
     *     "price_breakdown": {
     *       "subtotal": 21.0,
     *       "tax": 0.0,
     *       "delivery": 5.0,
     *       "total": 26.0
     *     }
     *   }
     * }
     */
    public function show($id)
    {
        $order = auth()->user()->orders()->with(['items.product', 'shippingAddress'])->findOrFail($id);

        return $this->successResponse([
            'id' => $order->id,
            'code' => $order->code,
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'items' => $order->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->name,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'subtotal' => $item->subtotal,
                ];
            }),
            'price_breakdown' => [
                'subtotal' => $order->subtotal,
                'tax' => $order->tax_total,
                'delivery' => $order->shipping_cost,
                'total' => $order->grand_total,
            ],
            'shipping_address' => $order->shippingAddress,
            'notes' => $order->notes,
            'invoice_url' => url("/api/milestone2/orders/{$order->id}/invoice"),
            'created_at' => $order->created_at,
        ], 'Order details retrieved');
    }

    /**
     * Reorder Previous Order
     *
     * Add items from a previous order back to the cart.
     *
     * @authenticated
     * @urlParam id integer required Order ID. Example: 1
     *
     * @response 200 {
     *   "success": true,
     *   "message": "Items added to cart from previous order"
     * }
     */
    public function reorder($id)
    {
        $order = auth()->user()->orders()->with('items')->findOrFail($id);

        foreach ($order->items as $item) {
            CartItem::updateOrCreate(
                ['user_id' => auth()->id(), 'product_id' => $item->product_id],
                ['quantity' => $item->quantity, 'is_saved_for_later' => false]
            );
        }

        return $this->successResponse(null, 'Items added to cart from previous order');
    }

    /**
     * Cancel Order
     *
     * Cancel an order if it has not been shipped yet.
     *
     * @authenticated
     * @urlParam id integer required Order ID. Example: 1
     *
     * @response 200 {
     *   "success": true,
     *   "message": "Order cancelled successfully"
     * }
     */
    public function cancel($id)
    {
        $order = auth()->user()->orders()->findOrFail($id);

        if ($order->status !== 'pending') {
            return $this->errorResponse('Only pending orders can be cancelled.');
        }

        DB::transaction(function () use ($order) {
            $order->update(['status' => 'cancelled']);
            
            // Refund stock
            foreach ($order->items as $item) {
                if ($item->product) {
                    $item->product->increment('stock', $item->quantity);
                }
            }
        });

        return $this->successResponse(null, 'Order cancelled successfully');
    }

    /**
     * Request Return / Refund
     *
     * @authenticated
     * @urlParam id integer required Order ID. Example: 1
     * @bodyParam reason string required The reason for return. Example: Damaged item
     *
     * @response 200 {
     *   "success": true,
     *   "message": "Return request submitted"
     * }
     */
    public function requestReturn(Request $request, $id)
    {
        $order = auth()->user()->orders()->findOrFail($id);

        if ($order->status !== 'delivered') {
            return $this->errorResponse('Only delivered orders can be returned.');
        }

        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first());
        }

        // Simplified return request: just update status or log it
        $order->update(['status' => 'refunded']); // In real app, you'd have a separate 'return_requested' status

        return $this->successResponse(null, 'Return request submitted');
    }

    /**
     * Download Invoice (Placeholder)
     *
     * @authenticated
     * @urlParam id integer required Order ID. Example: 1
     *
     * @response 200 {
     *   "success": true,
     *   "message": "Invoice generated",
     *   "data": { "url": "https://example.com/invoice.pdf" }
     * }
     */
    public function downloadInvoice($id)
    {
        $order = auth()->user()->orders()->findOrFail($id);
        
        // This is a placeholder. In a real app, you'd generate a PDF and return it.
        return $this->successResponse([
            'url' => url("/api/milestone2/orders/{$order->id}/invoice/pdf")
        ], 'Invoice generated');
    }
}
