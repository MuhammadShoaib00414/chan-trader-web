<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\AppBaseController;
use App\Models\SupplierPayment;
use App\Models\SupplierTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupplierPaymentController extends AppBaseController
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $payments = SupplierPayment::with('transaction.supplier', 'transaction.store')
            ->orderByDesc('paid_at')
            ->get();

        return $this->successResponse($payments, 'Supplier payments retrieved successfully');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_transaction_id' => 'required|exists:supplier_transactions,id',
            'amount' => 'required|numeric|gt:0',
            'paid_at' => 'required|date',
        ]);

        $transaction = SupplierTransaction::with(['supplier', 'store', 'payments'])->findOrFail($validated['supplier_transaction_id']);

        if ($transaction->status === 'completed') {
            return $this->errorResponse('Transaction is already completed', 400);
        }

        $nextInstallment = $transaction->paid_installments + 1;
        $expectedAmount = $transaction->next_installment_amount;

        if (abs(round((float) $validated['amount'], 2) - $expectedAmount) > 0.009) {
            return $this->errorResponse("Payment amount must be {$expectedAmount}", 400);
        }

        DB::transaction(function () use ($transaction, $validated, $nextInstallment, $expectedAmount) {
            SupplierPayment::create([
                'supplier_transaction_id' => $validated['supplier_transaction_id'],
                'amount' => $expectedAmount,
                'paid_at' => $validated['paid_at'],
                'installment_number' => $nextInstallment,
            ]);

            $transaction->forceFill([
                'paid_installments' => $nextInstallment,
                'status' => $nextInstallment >= $transaction->total_installments ? 'completed' : 'active',
            ])->save();
        });

        $transaction->refresh()->load(['supplier', 'store', 'payments']);

        return $this->successResponse($transaction, 'Payment recorded successfully', 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(SupplierPayment $payment)
    {
        return $this->successResponse($payment->load('transaction.supplier', 'transaction.store'), 'Supplier payment retrieved successfully');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, SupplierPayment $payment)
    {
        // For simplicity, payments are immutable once recorded
        return $this->errorResponse('Payments cannot be updated', 400);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SupplierPayment $payment)
    {
        // For simplicity, payments cannot be deleted
        return $this->errorResponse('Payments cannot be deleted', 400);
    }
}
