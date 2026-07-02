<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Shipment;
use App\Services\OrderManagementService;
use App\Support\VendorCatalogScope;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ShipmentController extends Controller
{
    public function __construct(private readonly OrderManagementService $orderManagementService)
    {
        $this->middleware('permission:shipments.update')->only(['store', 'update']);
    }


    public function store(Request $request, Order $order)
    {
        VendorCatalogScope::authorizeOrderAccessible($order, $request);

        $validated = $request->validate([
            'store_id' => ['required', 'exists:stores,id'],
            'carrier' => ['nullable', 'string', 'max:80'],
            'tracking_no' => ['nullable', 'string', 'max:120'],
            'cost' => ['nullable', 'numeric'],
        ]);

        $vendorStoreIds = VendorCatalogScope::vendorStoreIds($request);
        if ($vendorStoreIds !== [] && ! in_array((int) $validated['store_id'], $vendorStoreIds, true)) {
            abort(403, 'Unauthorized action.');
        }

        $shipment = $this->orderManagementService->createShipment(
            $order,
            (int) $validated['store_id'],
            $validated['carrier'] ?? null,
            $validated['tracking_no'] ?? null,
            (float) ($validated['cost'] ?? 0),
        );

        return response()->json(['success' => true, 'data' => $shipment], 201);
    }

    public function update(Request $request, Shipment $shipment)
    {
        $vendorStoreIds = VendorCatalogScope::vendorStoreIds($request);
        if ($vendorStoreIds !== [] && ! in_array((int) $shipment->store_id, $vendorStoreIds, true)) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'status' => ['sometimes', Rule::in(['pending', 'shipped', 'in_transit', 'delivered', 'failed', 'returned'])],
            'carrier' => ['nullable', 'string', 'max:80'],
            'tracking_no' => ['nullable', 'string', 'max:120'],
            'shipped_at' => ['nullable', 'date'],
            'delivered_at' => ['nullable', 'date'],
        ]);
        $shipment->update($validated);

        return response()->json(['success' => true, 'data' => $shipment]);
    }
}
