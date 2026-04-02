<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        $now = Carbon::now();

        $stats = [
            'sales' => [
                'today' => Order::whereDate('created_at', Carbon::today())->where('payment_status', 'paid')->sum('grand_total'),
                'week' => Order::whereBetween('created_at', [$now->startOfWeek(), $now->endOfWeek()])->where('payment_status', 'paid')->sum('grand_total'),
                'month' => Order::whereMonth('created_at', $now->month)->whereYear('created_at', $now->year)->where('payment_status', 'paid')->sum('grand_total'),
                'year' => Order::whereYear('created_at', $now->year)->where('payment_status', 'paid')->sum('grand_total'),
            ],
            'orders' => [
                'total' => Order::count(),
                'pending' => Order::where('status', 'pending')->count(),
            ],
            'customers' => User::role('user')->count(),
            'products' => Product::count(),
            'low_stock_products' => Product::lowStock()->count(),
        ];

        return response()->json([
            'status' => 'success',
            'data' => $stats
        ]);
    }
}
