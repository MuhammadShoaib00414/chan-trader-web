<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\AppBaseController;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Shipment;
use App\Models\Store;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorDashboardController extends AppBaseController
{
    /**
     * Vendor dashboard stats (mirrors admin web dashboard vendor block).
     *
     * @authenticated
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user('api');
        abort_unless($user->hasRole('vendor'), 403, 'Only vendors can access dashboard stats.');

        $now = Carbon::now();
        $storeIds = Store::where('owner_id', $user->id)->pluck('id');

        $orderIds = Order::query()
            ->whereHas('items', function ($q) use ($storeIds) {
                $q->whereIn('store_id', $storeIds);
            })
            ->pluck('id');

        $paidOrdersBase = fn () => Order::query()
            ->whereIn('id', $orderIds)
            ->where('payment_status', 'paid');

        $stats = [
            'my_products' => Product::whereIn('store_id', $storeIds)->count(),
            'my_orders' => $orderIds->count(),
            'pending_orders' => Order::whereIn('id', $orderIds)->where('status', 'pending')->count(),
            'payments' => Payment::whereIn('order_id', $orderIds)->count(),
            'shipments' => Shipment::whereIn('store_id', $storeIds)->count(),
            'sales' => [
                'today' => (float) $paidOrdersBase()
                    ->whereDate('created_at', Carbon::today())
                    ->sum('grand_total'),
                'week' => (float) $paidOrdersBase()
                    ->whereBetween('created_at', [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()])
                    ->sum('grand_total'),
                'month' => (float) $paidOrdersBase()
                    ->whereMonth('created_at', $now->month)
                    ->whereYear('created_at', $now->year)
                    ->sum('grand_total'),
                'year' => (float) $paidOrdersBase()
                    ->whereYear('created_at', $now->year)
                    ->sum('grand_total'),
                'total' => (float) $paidOrdersBase()->sum('grand_total'),
            ],
        ];

        return $this->successResponse($stats, 'Vendor dashboard stats retrieved');
    }
}
