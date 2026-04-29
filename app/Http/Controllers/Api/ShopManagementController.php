<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\ShopCustomer;
use App\Models\ShopSale;
use App\Models\ShopSaleItem;
use App\Models\ShopSalePayment;
use App\Models\StockItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ShopManagementController extends Controller
{
    public function storeCustomer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'phone' => ['nullable', 'string', 'max:40'],
            'address' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $customer = ShopCustomer::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Customer saved successfully.',
            'data' => $customer,
        ], 201);
    }

    public function storeSale(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => ['nullable', 'exists:shop_customers,id'],
            'customer_name' => ['nullable', 'string', 'max:160'],
            'customer_phone' => ['nullable', 'string', 'max:40'],
            'customer_address' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['nullable', 'numeric', 'min:0'],
            'received_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_method' => ['nullable', 'in:cash,bank,wallet'],
            'notes' => ['nullable', 'string'],
        ]);

        $validator->after(function ($validator) use ($request) {
            $receivedAmount = (float) ($request->input('received_amount', 0) ?? 0);
            $customerId = $request->input('customer_id');
            $customerName = trim((string) $request->input('customer_name', ''));

            if ($receivedAmount < 0) {
                $validator->errors()->add('received_amount', 'Received amount cannot be negative.');
            }

            if (! $customerId && $request->filled('customer_phone') && $customerName === '') {
                $validator->errors()->add('customer_name', 'Customer name is required when adding a new customer.');
            }
        });

        $validated = $validator->validate();

        $productIds = collect($validated['items'])->pluck('product_id')->all();
        $products = Product::query()
            ->whereIn('id', $productIds)
            ->get()
            ->keyBy('id');

        $subtotal = 0;
        $profitAmount = 0;
        $lineItems = [];

        foreach ($validated['items'] as $item) {
            $product = $products->get($item['product_id']);
            if (! $product) {
                return response()->json([
                    'success' => false,
                    'message' => 'One of the selected products could not be found.',
                ], 422);
            }

            if ($product->stock < $item['quantity']) {
                return response()->json([
                    'success' => false,
                    'message' => "Insufficient stock for {$product->name}. Available stock is {$product->stock}.",
                ], 422);
            }

            $unitPrice = isset($item['unit_price']) ? (float) $item['unit_price'] : (float) $product->price;
            $unitCost = (float) ($product->purchase_price ?? 0);
            $quantity = (int) $item['quantity'];
            $lineTotal = round($unitPrice * $quantity, 2);
            $lineProfit = round(($unitPrice - $unitCost) * $quantity, 2);

            $subtotal += $lineTotal;
            $profitAmount += $lineProfit;
            $lineItems[] = [
                'product' => $product,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'unit_cost' => $unitCost,
                'line_total' => $lineTotal,
                'profit_amount' => $lineProfit,
            ];
        }

        $subtotal = round($subtotal, 2);
        $profitAmount = round($profitAmount, 2);
        $receivedAmount = round((float) ($validated['received_amount'] ?? 0), 2);

        if ($receivedAmount > $subtotal) {
            return response()->json([
                'success' => false,
                'message' => 'Received amount cannot be greater than the total sale amount.',
            ], 422);
        }

        $balanceDue = round($subtotal - $receivedAmount, 2);

        if ($balanceDue > 0 && ! ($validated['customer_id'] ?? null) && ! ($validated['customer_name'] ?? null)) {
            return response()->json([
                'success' => false,
                'message' => 'Customer details are required for partial or credit sales.',
            ], 422);
        }

        $customer = null;
        $newCustomerPayload = null;
        if (! empty($validated['customer_id'])) {
            $customer = ShopCustomer::find($validated['customer_id']);
        } elseif (! empty($validated['customer_name'])) {
            $newCustomerPayload = [
                'name' => $validated['customer_name'],
                'phone' => $validated['customer_phone'] ?? null,
                'address' => $validated['customer_address'] ?? null,
            ];
        }

        $paymentStatus = $balanceDue <= 0
            ? 'paid'
            : ($receivedAmount > 0 ? 'partial' : 'credit');

        $sale = DB::transaction(function () use ($request, $customer, $newCustomerPayload, $validated, $lineItems, $subtotal, $profitAmount, $receivedAmount, $balanceDue, $paymentStatus) {
            $resolvedCustomer = $customer;
            if (! $resolvedCustomer && $newCustomerPayload) {
                $resolvedCustomer = ShopCustomer::create($newCustomerPayload);
            }

            $sale = ShopSale::create([
                'customer_id' => $resolvedCustomer?->id,
                'created_by' => $request->user()?->id,
                'bill_no' => $this->nextBillNumber(),
                'sale_date' => now()->toDateString(),
                'subtotal' => $subtotal,
                'received_amount' => $receivedAmount,
                'balance_due' => $balanceDue,
                'profit_amount' => $profitAmount,
                'payment_status' => $paymentStatus,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($lineItems as $lineItem) {
                ShopSaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $lineItem['product']->id,
                    'quantity' => $lineItem['quantity'],
                    'unit_price' => $lineItem['unit_price'],
                    'unit_cost' => $lineItem['unit_cost'],
                    'line_total' => $lineItem['line_total'],
                    'profit_amount' => $lineItem['profit_amount'],
                ]);

                $lineItem['product']->decrement('stock', $lineItem['quantity']);

                InventoryMovement::create([
                    'product_id' => $lineItem['product']->id,
                    'qty' => $lineItem['quantity'],
                    'type' => 'out',
                    'reason' => "Shop sale {$sale->bill_no}",
                    'reference_id' => $sale->id,
                    'reference_type' => ShopSale::class,
                    'created_at' => now(),
                ]);
            }

            if ($receivedAmount > 0) {
                ShopSalePayment::create([
                    'sale_id' => $sale->id,
                    'customer_id' => $resolvedCustomer?->id,
                    'created_by' => $request->user()?->id,
                    'amount' => $receivedAmount,
                    'method' => $validated['payment_method'] ?? 'cash',
                    'payment_date' => now()->toDateString(),
                    'note' => 'Initial payment received with sale.',
                ]);
            }

            return $sale->load(['customer', 'items.product', 'payments']);
        });

        return response()->json([
            'success' => true,
            'message' => 'Sale recorded successfully.',
            'data' => $sale,
        ], 201);
    }

    public function storePayment(Request $request, ShopSale $sale): JsonResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['required', 'in:cash,bank,wallet'],
            'payment_date' => ['nullable', 'date'],
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        if ($sale->balance_due <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'This sale has already been fully paid.',
            ], 422);
        }

        $amount = round((float) $validated['amount'], 2);

        if ($amount > (float) $sale->balance_due) {
            return response()->json([
                'success' => false,
                'message' => 'Payment amount cannot be greater than the remaining balance.',
            ], 422);
        }

        $payment = DB::transaction(function () use ($request, $sale, $validated, $amount) {
            $payment = ShopSalePayment::create([
                'sale_id' => $sale->id,
                'customer_id' => $sale->customer_id,
                'created_by' => $request->user()?->id,
                'amount' => $amount,
                'method' => $validated['method'],
                'payment_date' => $validated['payment_date'] ?? now()->toDateString(),
                'note' => $validated['note'] ?? null,
            ]);

            $updatedReceived = round((float) $sale->received_amount + $amount, 2);
            $updatedBalance = round((float) $sale->balance_due - $amount, 2);

            $sale->update([
                'received_amount' => $updatedReceived,
                'balance_due' => $updatedBalance,
                'payment_status' => $updatedBalance <= 0 ? 'paid' : 'partial',
            ]);

            return $payment;
        });

        return response()->json([
            'success' => true,
            'message' => 'Payment collected successfully.',
            'data' => $payment,
        ], 201);
    }

    public function storeStock(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'item_name' => ['required', 'string', 'max:180'],
            'purchase_price' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
        ]);

        $stockItem = StockItem::create([
            ...$validated,
            'created_by' => $request->user()?->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Stock item saved successfully.',
            'data' => $stockItem,
        ], 201);
    }

    public function updateStock(Request $request, StockItem $stockItem): JsonResponse
    {
        $validated = $request->validate([
            'item_name' => ['required', 'string', 'max:180'],
            'purchase_price' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
        ]);

        $stockItem->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Stock item updated successfully.',
            'data' => $stockItem->fresh(),
        ]);
    }

    public function destroyStock(StockItem $stockItem): JsonResponse
    {
        $stockItem->delete();

        return response()->json([
            'success' => true,
            'message' => 'Stock item deleted successfully.',
        ]);
    }

    private function nextBillNumber(): string
    {
        $prefix = now()->format('Ymd');
        $sequence = ShopSale::whereDate('created_at', now()->toDateString())->count() + 1;

        do {
            $billNo = sprintf('BILL-%s-%03d', $prefix, $sequence);
            $sequence++;
        } while (ShopSale::where('bill_no', $billNo)->exists());

        return $billNo;
    }
}
