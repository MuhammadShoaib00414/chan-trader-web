<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\AppBaseController;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Services\OrderManagementService;
use App\Support\VendorCatalogScope;
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

    public function __construct(private readonly OrderManagementService $orderManagementService)
    {
        $this->middleware('permission:orders.view')->only(['index', 'show', 'timeline']);
        $this->middleware('permission:orders.update')->only(['updateStatus', 'updateItemStatus']);
        $this->middleware('permission:payments.capture')->only(['payments']);
        $this->middleware('permission:orders.refund')->only(['refund']);
        $this->middleware('permission:shipments.update')->only(['shipments']);
    }

    public function index(Request $request)
    {
        $vendorId = (int) $request->user('api')->id;
        $status = (string) $request->query('status', '');
        $code = trim((string) $request->query('code', ''));
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
        if ($code !== '') {
            $query->where('code', 'like', "%{$code}%");
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
                    'payment_status' => $order->payment_status,
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
            'payments:id,order_id,method,amount,status,paid_at',
            'shipments:id,order_id,store_id,carrier,tracking_no,status,cost,shipped_at,delivered_at',
            'items' => fn ($q) => $q
                ->whereHas('store', fn ($sq) => $sq->where('owner_id', $vendorId))
                ->with(['product:id,name,feature_image', 'store:id,name,owner_id']),
        ]);
        $timeline = OrderStatusHistory::where('order_id', $order->id)
            ->orderBy('created_at')
            ->get(['from_status', 'to_status', 'comment', 'created_at']);
        $shipments = $order->shipments()
            ->whereIn('store_id', VendorCatalogScope::vendorStoreIds($request))
            ->get(['id', 'order_id', 'store_id', 'carrier', 'tracking_no', 'status', 'cost', 'shipped_at', 'delivered_at']);

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
            'payments' => $order->payments,
            'shipments' => $shipments,
            'timeline' => $timeline,
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
        $item = $this->resolveVendorOrderItem($request, $order, $item->id);

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

    public function updateStatus(Request $request, Order $order)
    {
        VendorCatalogScope::authorizeOrderAccessible($order, $request);

        $validated = $request->validate([
            'to_status' => ['required', Rule::in(self::ITEM_STATUSES)],
            'comment' => ['nullable', 'string', 'max:255'],
            'notify_customer' => ['nullable', 'boolean'],
        ]);

        $order = $this->orderManagementService->updateOrderStatus(
            $order,
            $validated['to_status'],
            (int) $request->user('api')->id,
            $validated['comment'] ?? null,
            (bool) ($validated['notify_customer'] ?? false),
        );

        return $this->successResponse([
            'id' => $order->id,
            'status' => $order->status,
        ], 'Order status updated');
    }

    public function timeline(Request $request, Order $order)
    {
        VendorCatalogScope::authorizeOrderAccessible($order, $request);

        $items = OrderStatusHistory::where('order_id', $order->id)
            ->orderBy('created_at')
            ->get();

        return $this->successResponse($items, 'Order timeline retrieved');
    }

    public function payments(Request $request, Order $order)
    {
        VendorCatalogScope::authorizeOrderAccessible($order, $request);

        $validated = $request->validate([
            'method' => ['required', 'in:cod,card,bank,wallet'],
            'amount' => ['required', 'numeric'],
            'provider_txn_id' => ['nullable', 'string', 'max:120'],
        ]);

        $payment = $this->orderManagementService->capturePayment(
            $order,
            $validated['method'],
            (float) $validated['amount'],
            $validated['provider_txn_id'] ?? null,
        );

        return $this->successResponse($payment, 'Payment captured', 201);
    }

    public function refund(Request $request, Order $order)
    {
        VendorCatalogScope::authorizeOrderAccessible($order, $request);

        $validated = $request->validate([
            'amount' => ['required', 'numeric'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $payment = $this->orderManagementService->refundPayment(
            $order,
            (float) $validated['amount'],
            $validated['reason'] ?? null,
        );

        return $this->successResponse($payment, 'Refund processed');
    }

    public function shipments(Request $request, Order $order)
    {
        VendorCatalogScope::authorizeOrderAccessible($order, $request);
        $vendorId = (int) $request->user('api')->id;

        $validated = $request->validate([
            'store_id' => ['required', 'exists:stores,id'],
            'carrier' => ['nullable', 'string', 'max:80'],
            'tracking_no' => ['nullable', 'string', 'max:120'],
            'cost' => ['nullable', 'numeric'],
        ]);

        $storeOwned = $order->items()
            ->where('store_id', (int) $validated['store_id'])
            ->whereHas('store', fn ($q) => $q->where('owner_id', $vendorId))
            ->exists();
        abort_unless($storeOwned, 403, 'Unauthorized action.');

        $shipment = $this->orderManagementService->createShipment(
            $order,
            (int) $validated['store_id'],
            $validated['carrier'] ?? null,
            $validated['tracking_no'] ?? null,
            (float) ($validated['cost'] ?? 0),
        );

        return $this->successResponse($shipment, 'Shipment created', 201);
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

    private function resolveVendorOrderItem(Request $request, Order $order, int|string $itemId): OrderItem
    {
        $vendorId = (int) $request->user('api')->id;

        $item = $order->items()
            ->whereKey((int) $itemId)
            ->whereHas('store', fn ($q) => $q->where('owner_id', $vendorId))
            ->first();

        if (! $item) {
            abort(404);
        }

        return $item;
    }
}
