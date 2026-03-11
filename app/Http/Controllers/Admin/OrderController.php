<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderStatusHistory;
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
        $query = Order::query();
        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }
        if ($request->filled('code')) {
            $query->where('code', $request->string('code')->toString());
        }
        if ($request->filled('store_id')) {
            $storeId = (int) $request->get('store_id');
            $query->whereHas('items', fn($q) => $q->where('store_id', $storeId));
        }
        if ($request->filled('user_id')) {
            $query->where('user_id', (int) $request->get('user_id'));
        }
        $orders = $query->latest()->paginate(20);
        return response()->json(['success' => true, 'data' => $orders->items(), 'pagination' => [
            'total' => $orders->total(),
            'per_page' => $orders->perPage(),
            'current_page' => $orders->currentPage(),
            'last_page' => $orders->lastPage(),
        ]]);
    }

    public function show(Order $order)
    {
        return response()->json(['success' => true, 'data' => $order]);
    }

    public function updateStatus(Request $request, Order $order)
    {
        $validated = $request->validate([
            'to_status' => ['required', Rule::in(['pending','confirmed','packed','shipped','delivered','cancelled','refunded'])],
            'comment' => ['nullable', 'string', 'max:255'],
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
        return response()->json(['success' => true, 'data' => $order]);
    }

    public function timeline(Order $order)
    {
        $items = OrderStatusHistory::where('order_id', $order->id)->orderBy('created_at')->get();
        return response()->json(['success' => true, 'data' => $items]);
    }
}
