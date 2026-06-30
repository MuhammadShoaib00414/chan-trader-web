<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\AppBaseController;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VendorOrderController extends AppBaseController
{
    private const ITEM_STATUSES = [
        'pending',
        'confirmed',
        'packed',
        'shipped',
        'delivered',
        'cancelled',
        'refunded',
    ];

    public function index(Request $request)
    {
        $vendorId = (int) $request->user('api')->id;
        $status = (string) $request->query('status', '');
        $perPage = min(max((int) $request->query('per_page', 10), 1), 50);

        $query = Order::query()
            ->whereHas('items.store', function ($q) use ($vendorId) {
                $q->where('owner_id', $vendorId);
            })
            ->with([
                'user:id,first_name,last_name,email,phone_number',
                'items' => function ($q) use ($vendorId, $status) {
                    $q->whereHas('store', fn ($sq) => $sq->where('owner_id', $vendorId))
                        ->when($status !== '', fn ($sq) => $sq->where('status', $status))
                        ->with(['product:id,name,feature_image', 'store:id,name,owner_id']);
                },
                'shippingAddress:id,title,name,phone,address_line_1,address_line_2,city,state,country,postal_code',
            ])
            ->latest();

        if ($status !== '') {
            $query->whereHas('items', function ($q) use ($vendorId, $status) {
                $q->where('status', $status)
                    ->whereHas('store', fn ($sq) => $sq->where('owner_id', $vendorId));
            });
        }

        $orders = $query->paginate($perPage);

        return $this->successResponse([
            'items' => $orders->getCollection()->map(function (Order $order) {
                $vendorSubtotal = (float) $order->items->sum('subtotal');
                $customer = $order->user;

                return [
                    'id' => $order->id,
                    'code' => $order->code,
                    'status' => $order->status,
                    'created_at' => $order->created_at,
                    'vendor_subtotal' => $vendorSubtotal,
                    'grand_total' => (float) $order->grand_total,
                    'customer' => $customer ? [
                        'id' => $customer->id,
                        'name' => $customer->name,
                        'email' => $customer->email,
                        'phone' => $customer->phone_number,
                    ] : null,
                    'items' => $order->items->map(function (OrderItem $item) {
                        return [
                            'id' => $item->id,
                            'status' => $item->status,
                            'product_id' => $item->product_id,
                            'name' => $item->name,
                            'sku' => $item->sku,
                            'quantity' => $item->quantity,
                            'unit_price' => (float) $item->unit_price,
                            'subtotal' => (float) $item->subtotal,
                            'store' => $item->store ? [
                                'id' => $item->store->id,
                                'name' => $item->store->name,
                            ] : null,
                            'product' => $item->product ? [
                                'id' => $item->product->id,
                                'name' => $item->product->name,
                                'feature_image' => $item->product->feature_image,
                            ] : null,
                        ];
                    }),
                ];
            })->values(),
            'pagination' => [
                'total' => $orders->total(),
                'per_page' => $orders->perPage(),
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
            ],
        ], 'Vendor orders retrieved');
    }

    public function show(Request $request, Order $order)
    {
        $vendorId = (int) $request->user('api')->id;
        abort_unless(
            $order->items()->whereHas('store', fn ($q) => $q->where('owner_id', $vendorId))->exists(),
            404
        );

        $order->load([
            'user:id,first_name,last_name,email,phone_number',
            'shippingAddress:id,title,name,phone,address_line_1,address_line_2,city,state,country,postal_code',
            'items' => fn ($q) => $q
                ->whereHas('store', fn ($sq) => $sq->where('owner_id', $vendorId))
                ->with(['product:id,name,feature_image', 'store:id,name,owner_id']),
        ]);

        return $this->successResponse([
            'id' => $order->id,
            'code' => $order->code,
            'status' => $order->status,
            'created_at' => $order->created_at,
            'payment_status' => $order->payment_status,
            'notes' => $order->notes,
            'vendor_subtotal' => (float) $order->items->sum('subtotal'),
            'grand_total' => (float) $order->grand_total,
            'customer' => $order->user ? [
                'id' => $order->user->id,
                'name' => $order->user->name,
                'email' => $order->user->email,
                'phone' => $order->user->phone_number,
            ] : null,
            'shipping_address' => $order->shippingAddress,
            'items' => $order->items->map(function (OrderItem $item) {
                return [
                    'id' => $item->id,
                    'status' => $item->status,
                    'product_id' => $item->product_id,
                    'name' => $item->name,
                    'sku' => $item->sku,
                    'quantity' => $item->quantity,
                    'unit_price' => (float) $item->unit_price,
                    'subtotal' => (float) $item->subtotal,
                    'store' => $item->store ? [
                        'id' => $item->store->id,
                        'name' => $item->store->name,
                    ] : null,
                    'product' => $item->product ? [
                        'id' => $item->product->id,
                        'name' => $item->product->name,
                        'feature_image' => $item->product->feature_image,
                    ] : null,
                ];
            })->values(),
        ], 'Vendor order details retrieved');
    }

    public function updateItemStatus(Request $request, Order $order, OrderItem $item)
    {
        $vendorId = (int) $request->user('api')->id;
        abort_unless($item->order_id === $order->id, 404);
        abort_unless($item->store()->where('owner_id', $vendorId)->exists(), 404);

        $validated = $request->validate([
            'status' => ['required', Rule::in(self::ITEM_STATUSES)],
        ]);

        $item->update(['status' => $validated['status']]);
        $this->syncOrderStatus($order);

        return $this->successResponse([
            'order_id' => $order->id,
            'item_id' => $item->id,
            'item_status' => $item->status,
            'order_status' => $order->fresh()->status,
        ], 'Order item status updated');
    }

    private function syncOrderStatus(Order $order): void
    {
        $statuses = $order->items()->pluck('status')->all();
        if (empty($statuses)) {
            return;
        }

        $next = 'pending';
        if (count(array_unique($statuses)) === 1) {
            $next = $statuses[0];
        } elseif (in_array('shipped', $statuses, true)) {
            $next = 'shipped';
        } elseif (in_array('packed', $statuses, true)) {
            $next = 'packed';
        } elseif (in_array('confirmed', $statuses, true)) {
            $next = 'confirmed';
        }

        $order->update(['status' => $next]);
    }
}
