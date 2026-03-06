<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::query();
        if ($request->filled('order_id')) {
            $query->where('order_id', (int) $request->get('order_id'));
        }
        $items = $query->latest()->paginate(20);
        return response()->json(['success' => true, 'data' => $items->items(), 'pagination' => [
            'total' => $items->total(),
            'per_page' => $items->perPage(),
            'current_page' => $items->currentPage(),
            'last_page' => $items->lastPage(),
        ]]);
    }

    public function store(Request $request, Order $order)
    {
        $validated = $request->validate([
            'method' => ['required', 'in:cod,card,bank,wallet'],
            'amount' => ['required', 'numeric'],
            'provider_txn_id' => ['nullable', 'string', 'max:120'],
        ]);
        $payment = Payment::create([
            'order_id' => $order->id,
            'method' => $validated['method'],
            'amount' => $validated['amount'],
            'status' => 'succeeded',
            'provider_txn_id' => $validated['provider_txn_id'] ?? null,
            'paid_at' => now(),
        ]);
        $order->update(['payment_status' => 'paid']);
        return response()->json(['success' => true, 'data' => $payment], 201);
    }

    public function refund(Request $request, Order $order)
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);
        $payment = Payment::create([
            'order_id' => $order->id,
            'method' => 'card',
            'amount' => $validated['amount'],
            'status' => 'refunded',
            'paid_at' => now(),
        ]);
        $order->update(['payment_status' => 'refunded']);
        return response()->json(['success' => true, 'data' => $payment]);
    }
}
