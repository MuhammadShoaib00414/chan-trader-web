<?php

namespace App\Http\Controllers\Admin;

use App\Enums\NotificationAction;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Services\Notifications\AppNotificationService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:orders.view')->only(['index', 'show', 'timeline']);
        $this->middleware('permission:orders.update')->only(['updateStatus']);
    }

    public function index(Request $request)
    {
        $query = Order::query()->with(['user:id,first_name,last_name,email', 'shippingAddress']);

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

    public function show(Order $order)
    {
        return response()->json([
            'success' => true,
            'data' => $order->load(['user', 'shippingAddress', 'items.product', 'payments']),
        ]);
    }

    public function updateStatus(Request $request, Order $order)
    {
        $validated = $request->validate([
            'to_status' => ['required', Rule::in(['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'])],
            'comment' => ['nullable', 'string', 'max:255'],
            'notify_customer' => ['nullable', 'boolean'],
        ]);

        $from = $order->status;
        $order->update(['status' => $validated['to_status']]);

        OrderStatusHistory::create([
            'order_id' => $order->id,
            'from_status' => $from,
            'to_status' => $validated['to_status'],
            'changed_by' => $request->user()->id,
            'comment' => $validated['comment'] ?? null,
            'created_at' => now(),
        ]);

        if ($order->user) {
            $action = match ($validated['to_status']) {
                'confirmed' => NotificationAction::OrderConfirmed,
                'shipped' => NotificationAction::OrderShipped,
                'delivered' => NotificationAction::OrderDelivered,
                'cancelled' => NotificationAction::OrderCancelled,
                'refunded' => NotificationAction::PaymentRefunded,
                default => NotificationAction::OrderStatusUpdated,
            };

            $payload = [
                'message' => "Your order {$order->code} is now {$validated['to_status']}.",
                'order_code' => $order->code,
                'status' => $validated['to_status'],
            ];

            $notifyCustomer = $request->boolean('notify_customer');

            // Always persist in-app notification; send email+push only when requested
            app(AppNotificationService::class)->notify(
                $order->user,
                $action,
                $payload,
                $notifyCustomer,
                $notifyCustomer,
            );
        }

        return response()->json(['success' => true, 'data' => $order->load('user')]);
    }

    public function printInvoice(Order $order)
    {
        return response()->json([
            'success' => true,
            'message' => 'Invoice generated',
            'data' => [
                'url' => url("/api/admin/orders/{$order->id}/invoice/pdf"),
            ],
        ]);
    }

    public function resendConfirmation(Order $order)
    {
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

    public function cancel(Order $order)
    {
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

    public function timeline(Order $order)
    {
        $items = OrderStatusHistory::where('order_id', $order->id)->orderBy('created_at')->get();

        return response()->json(['success' => true, 'data' => $items]);
    }
}
