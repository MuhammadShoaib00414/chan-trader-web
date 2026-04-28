<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ShopCustomer;
use App\Models\ShopSale;
use Inertia\Inertia;
use Inertia\Response;

class ShopManagementPageController extends Controller
{
    public function dashboard(): Response
    {
        $today = now()->toDateString();

        $stats = [
            'today_sales' => (float) ShopSale::whereDate('sale_date', $today)->sum('subtotal'),
            'today_profit' => (float) ShopSale::whereDate('sale_date', $today)->sum('profit_amount'),
            'receivables' => (float) ShopSale::sum('balance_due'),
            'customers_with_dues' => ShopCustomer::whereHas('sales', function ($query) {
                $query->where('balance_due', '>', 0);
            })->count(),
            'low_stock_products' => Product::lowStock()->count(),
            'inventory_cost_value' => (float) Product::query()
                ->selectRaw('COALESCE(SUM(stock * purchase_price), 0) as total')
                ->value('total'),
        ];

        $lowStockProducts = Product::query()
            ->whereColumn('stock', '<=', 'low_stock_threshold')
            ->orderBy('stock')
            ->take(8)
            ->get(['id', 'name', 'sku', 'stock', 'low_stock_threshold', 'price']);

        $recentSales = ShopSale::query()
            ->with('customer:id,name')
            ->latest()
            ->take(8)
            ->get(['id', 'customer_id', 'bill_no', 'subtotal', 'received_amount', 'balance_due', 'profit_amount', 'payment_status', 'sale_date', 'created_at'])
            ->map(function (ShopSale $sale) {
                return [
                    'id' => $sale->id,
                    'bill_no' => $sale->bill_no,
                    'customer_name' => $sale->customer?->name ?? 'Walk-in customer',
                    'subtotal' => $sale->subtotal,
                    'received_amount' => $sale->received_amount,
                    'balance_due' => $sale->balance_due,
                    'profit_amount' => $sale->profit_amount,
                    'payment_status' => $sale->payment_status,
                    'sale_date' => $sale->sale_date?->toDateString(),
                    'created_at' => $sale->created_at?->toISOString(),
                ];
            });

        return Inertia::render('shop/dashboard', [
            'stats' => $stats,
            'lowStockProducts' => $lowStockProducts,
            'recentSales' => $recentSales,
        ]);
    }

    public function customers(): Response
    {
        $customers = ShopCustomer::query()
            ->withSum('sales as outstanding_balance', 'balance_due')
            ->withCount('sales')
            ->latest()
            ->get(['id', 'name', 'phone', 'address', 'notes', 'created_at'])
            ->map(function (ShopCustomer $customer) {
                return [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'phone' => $customer->phone,
                    'address' => $customer->address,
                    'notes' => $customer->notes,
                    'sales_count' => $customer->sales_count,
                    'outstanding_balance' => (float) ($customer->outstanding_balance ?? 0),
                    'created_at' => $customer->created_at?->toISOString(),
                ];
            });

        $recentCreditSales = ShopSale::query()
            ->with('customer:id,name')
            ->where('balance_due', '>', 0)
            ->latest()
            ->take(8)
            ->get(['id', 'customer_id', 'bill_no', 'subtotal', 'received_amount', 'balance_due', 'sale_date'])
            ->map(function (ShopSale $sale) {
                return [
                    'id' => $sale->id,
                    'bill_no' => $sale->bill_no,
                    'customer_name' => $sale->customer?->name ?? 'Walk-in customer',
                    'subtotal' => $sale->subtotal,
                    'received_amount' => $sale->received_amount,
                    'balance_due' => $sale->balance_due,
                    'sale_date' => $sale->sale_date?->toDateString(),
                ];
            });

        return Inertia::render('shop/customers', [
            'customers' => $customers,
            'recentCreditSales' => $recentCreditSales,
        ]);
    }

    public function sales(): Response
    {
        $products = Product::query()
            ->orderBy('name')
            ->get(['id', 'name', 'sku', 'price', 'purchase_price', 'stock', 'low_stock_threshold']);

        $customers = ShopCustomer::query()
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'address']);

        $sales = ShopSale::query()
            ->with([
                'customer:id,name,phone',
                'items.product:id,name,sku',
                'payments:id,sale_id,amount,method,payment_date',
            ])
            ->latest()
            ->take(30)
            ->get(['id', 'customer_id', 'bill_no', 'sale_date', 'subtotal', 'received_amount', 'balance_due', 'profit_amount', 'payment_status', 'notes', 'created_at'])
            ->map(function (ShopSale $sale) {
                return [
                    'id' => $sale->id,
                    'bill_no' => $sale->bill_no,
                    'sale_date' => $sale->sale_date?->toDateString(),
                    'customer' => $sale->customer ? [
                        'id' => $sale->customer->id,
                        'name' => $sale->customer->name,
                        'phone' => $sale->customer->phone,
                    ] : null,
                    'subtotal' => $sale->subtotal,
                    'received_amount' => $sale->received_amount,
                    'balance_due' => $sale->balance_due,
                    'profit_amount' => $sale->profit_amount,
                    'payment_status' => $sale->payment_status,
                    'notes' => $sale->notes,
                    'created_at' => $sale->created_at?->toISOString(),
                    'items' => $sale->items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'product_name' => $item->product?->name ?? 'Unknown product',
                            'sku' => $item->product?->sku,
                            'quantity' => $item->quantity,
                            'unit_price' => $item->unit_price,
                            'line_total' => $item->line_total,
                        ];
                    })->values(),
                    'payments' => $sale->payments->map(function ($payment) {
                        return [
                            'id' => $payment->id,
                            'amount' => $payment->amount,
                            'method' => $payment->method,
                            'payment_date' => $payment->payment_date?->toDateString(),
                        ];
                    })->values(),
                ];
            });

        return Inertia::render('shop/sales', [
            'products' => $products,
            'customers' => $customers,
            'sales' => $sales,
        ]);
    }
}
