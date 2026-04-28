<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\AppBaseController;
use App\Models\Supplier;
use App\Models\SupplierTransaction;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SupplierTransactionController extends AppBaseController
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $transactions = SupplierTransaction::with(['supplier', 'store', 'payments'])
            ->latest()
            ->get();

        return $this->successResponse($transactions, 'Supplier transactions retrieved successfully');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'store_id' => 'nullable|exists:stores,id',
            'goods_value' => 'required|numeric|gt:0',
            'total_payable' => 'required|numeric|gte:goods_value',
            'payment_duration' => ['required', 'integer', Rule::in([1, 2])],
        ]);

        $supplier = Supplier::with('stores:id')->findOrFail($validated['supplier_id']);

        if (! empty($validated['store_id']) && ! $supplier->stores->contains('id', (int) $validated['store_id'])) {
            return $this->errorResponse('Selected store is not assigned to this supplier', 422);
        }

        $totalInstallments = (int) $validated['payment_duration'] === 1 ? 4 : 8;
        $installmentAmount = round((float) $validated['total_payable'] / $totalInstallments, 2);

        $transaction = SupplierTransaction::create([
            'supplier_id' => $validated['supplier_id'],
            'store_id' => $validated['store_id'] ?? null,
            'goods_value' => $validated['goods_value'],
            'total_payable' => $validated['total_payable'],
            'payment_duration' => $validated['payment_duration'],
            'installment_amount' => $installmentAmount,
            'total_installments' => $totalInstallments,
            'paid_installments' => 0,
            'status' => 'active',
        ]);

        return $this->successResponse($transaction->load(['supplier', 'store', 'payments']), 'Supplier transaction created successfully', 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(SupplierTransaction $transaction)
    {
        return $this->successResponse($transaction->load('supplier', 'store', 'payments'), 'Supplier transaction retrieved successfully');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, SupplierTransaction $supplierTransaction)
    {
        // For simplicity, only allow updating if no payments made
        if ($supplierTransaction->paid_installments > 0) {
            return $this->errorResponse('Cannot update transaction with existing payments', 400);
        }

        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'store_id' => 'nullable|exists:stores,id',
            'goods_value' => 'required|numeric|gt:0',
            'total_payable' => 'required|numeric|gte:goods_value',
            'payment_duration' => ['required', 'integer', Rule::in([1, 2])],
        ]);

        $supplier = Supplier::with('stores:id')->findOrFail($validated['supplier_id']);

        if (! empty($validated['store_id']) && ! $supplier->stores->contains('id', (int) $validated['store_id'])) {
            return $this->errorResponse('Selected store is not assigned to this supplier', 422);
        }

        $totalInstallments = (int) $validated['payment_duration'] === 1 ? 4 : 8;
        $installmentAmount = round((float) $validated['total_payable'] / $totalInstallments, 2);

        $supplierTransaction->update([
            'supplier_id' => $validated['supplier_id'],
            'store_id' => $validated['store_id'] ?? null,
            'goods_value' => $validated['goods_value'],
            'total_payable' => $validated['total_payable'],
            'payment_duration' => $validated['payment_duration'],
            'installment_amount' => $installmentAmount,
            'total_installments' => $totalInstallments,
        ]);

        return $this->successResponse($supplierTransaction->load(['supplier', 'store', 'payments']), 'Supplier transaction updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SupplierTransaction $supplierTransaction)
    {
        if ($supplierTransaction->paid_installments > 0) {
            return $this->errorResponse('Cannot delete transaction with existing payments', 400);
        }

        $supplierTransaction->delete();

        return $this->successResponse(null, 'Supplier transaction deleted successfully');
    }
}
