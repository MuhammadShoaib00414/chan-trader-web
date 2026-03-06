<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Shipment;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ShipmentController extends Controller
{
    public function store(Request $request, Order $order)
    {
        $validated = $request->validate([
            'store_id' => ['required', 'exists:stores,id'],
            'carrier' => ['nullable', 'string', 'max:80'],
            'tracking_no' => ['nullable', 'string', 'max:120'],
            'cost' => ['nullable', 'numeric'],
        ]);
        $shipment = Shipment::create([
            'order_id' => $order->id,
            'store_id' => $validated['store_id'],
            'carrier' => $validated['carrier'] ?? null,
            'tracking_no' => $validated['tracking_no'] ?? null,
            'status' => 'pending',
            'cost' => $validated['cost'] ?? 0,
        ]);
        return response()->json(['success' => true, 'data' => $shipment], 201);
    }

    public function update(Request $request, Shipment $shipment)
    {
        $validated = $request->validate([
            'status' => ['sometimes', Rule::in(['pending','shipped','in_transit','delivered','failed','returned'])],
            'carrier' => ['nullable', 'string', 'max:80'],
            'tracking_no' => ['nullable', 'string', 'max:120'],
            'shipped_at' => ['nullable', 'date'],
            'delivered_at' => ['nullable', 'date'],
        ]);
        $shipment->update($validated);
        return response()->json(['success' => true, 'data' => $shipment]);
    }
}
