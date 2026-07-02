<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Services\OrderManagementService;
use App\Support\VendorCatalogScope;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function __construct(private readonly OrderManagementService $orderManagementService)
    {
        $this->middleware('permission:orders.view')->only(['index', 'show', 'timeline']);
        $this->middleware('permission:orders.update')->only(['updateStatus']);
    }


    public function index(Request $request)
    {
        $query = Order::query()->with(['user:id,first_name,last_name,email', 'shippingAddress']);
        VendorCatalogScope::applyOrderScope($query, $request);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }
        if ($request->filled('code')) {
            $query->where('code', 'like', "%{$request->string('code')}%");
        }
        if ($request->filled('store_id')) {
            $storeId = (int) $request->get('store_id');
            $query->whereHas('items', fn ($q) => $q->where('store_id', $storeId));
        }
        if ($request->filled('user_id')) {
            $query->where('user_id', (int) $request->get('user_id'));
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->get('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->get('date_to'));
        }

        $orders = $query->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $orders->items(),
            'pagination' => [
                'total' => $orders->total(),
                'per_page' => $orders->perPage(),
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
            ],
        ]);
    }

    public function show(Request $request, Order $order)
    {
        VendorCatalogScope::authorizeOrderAccessible($order, $request);

        return response()->json([
            'success' => true,
            'data' => $order->load(['user', 'shippingAddress', 'items.product', 'payments']),
        ]);
    }

    public function updateStatus(Request $request, Order $order)
    {
        VendorCatalogScope::authorizeOrderAccessible($order, $request);

        $validated = $request->validate([
            'to_status' => ['required', Rule::in(['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'])],
            'comment' => ['nullable', 'string', 'max:255'],
            'notify_customer' => ['nullable', 'boolean'],
        ]);

        $order = $this->orderManagementService->updateOrderStatus(
            $order,
            $validated['to_status'],
            (int) $request->user()->id,
            $validated['comment'] ?? null,
            $request->boolean('notify_customer'),
        );

        return response()->json(['success' => true, 'data' => $order->load('user')]);
    }

    public function printInvoice(Request $request, Order $order)
    {
        VendorCatalogScope::authorizeOrderAccessible($order, $request);

        return response()->json([
            'success' => true,
            'message' => 'Invoice generated',
            'data' => [
                'url' => url("/api/admin/orders/{$order->id}/invoice/pdf"),
            ],
        ]);
    }

    public function resendConfirmation(Request $request, Order $order)
    {
        VendorCatalogScope::authorizeOrderAccessible($order, $request);

        if ($order->user) {
            app(AppNotificationService::class)->notify(
                $order->user,
                NotificationAction::OrderConfirmed,
                [
                    'order_code' => $order->code,
                    'message' => "Your order {$order->code} has been confirmed.",
                ],
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Order confirmation resent successfully',
        ]);
    }

    public function cancel(Request $request, Order $order)
    {
        VendorCatalogScope::authorizeOrderAccessible($order, $request);

        if ($order->status === 'shipped' || $order->status === 'delivered') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot cancel an order that has already been shipped or delivered.',
            ], 400);
        }

        $order->update(['status' => 'cancelled']);

        foreach ($order->items as $item) {
            $item->product?->increment('stock', $item->quantity);
        }

        if ($order->user) {
            app(AppNotificationService::class)->notify(
                $order->user,
                NotificationAction::OrderCancelled,
                [
                    'order_code' => $order->code,
                    'message' => "Your order {$order->code} has been cancelled.",
                ],
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Order cancelled successfully',
        ]);
    }

    public function timeline(Request $request, Order $order)
    {
        VendorCatalogScope::authorizeOrderAccessible($order, $request);

        $items = OrderStatusHistory::where('order_id', $order->id)->orderBy('created_at')->get();

        return response()->json(['success' => true, 'data' => $items]);
    }
}
