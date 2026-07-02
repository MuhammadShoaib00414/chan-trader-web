<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Services\OrderManagementService;
use App\Support\VendorCatalogScope;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(private readonly OrderManagementService $orderManagementService)
    {
        $this->middleware('permission:payments.view')->only(['index']);
        $this->middleware('permission:payments.capture')->only(['store']);
        $this->middleware('permission:orders.refund')->only(['refund']);
    }


    public function index(Request $request)
    {
        $query = Payment::query()->with('order.user');
        $vendorStoreIds = VendorCatalogScope::vendorStoreIds($request);
        if ($vendorStoreIds !== []) {
            $query->whereHas('order.items', fn ($q) => $q->whereIn('store_id', $vendorStoreIds));
        }

        if ($request->filled('order_id')) {
            $query->where('order_id', (int) $request->get('order_id'));
        }
        if ($request->filled('method')) {
            $query->where('method', $request->get('method'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        $items = $query->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $items->items(),
            'pagination' => [
                'total' => $items->total(),
                'per_page' => $items->perPage(),
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
            ],
        ]);
    }

    public function show(Payment $payment)
    {
        return response()->json([
            'success' => true,
            'data' => $payment->load('order.user'),
        ]);
    }

    public function export(Request $request)
    {
        $this->authorize('viewAny', Payment::class);

        // Placeholder for data export logic
        return response()->json([
            'success' => true,
            'message' => 'Payment transactions export generated',
            'data' => [
                'url' => url('/api/admin/payments/export/csv'),
            ],
        ]);
    }

    public function configureGateway(Request $request)
    {
        $this->authorize('update', Payment::class); // Assuming general payment permission

        $validated = $request->validate([
            'gateway' => 'required|in:jazzcash,easypaisa,cod',
            'settings' => 'required|array',
        ]);

        // Placeholder for updating config/database settings
        return response()->json([
            'success' => true,
            'message' => "Gateway '{$validated['gateway']}' configuration updated",
        ]);
    }

    public function store(Request $request, Order $order)
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

        return response()->json(['success' => true, 'data' => $payment], 201);
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

        return response()->json(['success' => true, 'data' => $payment]);
    }
}
