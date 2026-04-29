<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\AppBaseController;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SupplierController extends AppBaseController
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $suppliers = Supplier::with('stores:id,name')
            ->orderBy('name')
            ->get();

        return $this->successResponse($suppliers, 'Suppliers retrieved successfully');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:suppliers',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'category' => ['required', 'string', Rule::in(Supplier::CATEGORIES)],
            'store_ids' => 'nullable|array',
            'store_ids.*' => 'integer|exists:stores,id',
        ]);

        $supplier = Supplier::create(collect($validated)->except('store_ids')->all());
        $supplier->stores()->sync($validated['store_ids'] ?? []);

        return $this->successResponse($supplier->load('stores:id,name'), 'Supplier created successfully', 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Supplier $supplier)
    {
        return $this->successResponse(
            $supplier->load([
                'stores:id,name',
                'transactions.supplier:id,name',
                'transactions.store:id,name',
                'transactions.payments:id,supplier_transaction_id,amount,paid_at,installment_number',
            ]),
            'Supplier retrieved successfully'
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:suppliers,email,' . $supplier->id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'category' => ['required', 'string', Rule::in(Supplier::CATEGORIES)],
            'store_ids' => 'nullable|array',
            'store_ids.*' => 'integer|exists:stores,id',
        ]);

        $supplier->update(collect($validated)->except('store_ids')->all());
        $supplier->stores()->sync($validated['store_ids'] ?? []);

        return $this->successResponse($supplier->load('stores:id,name'), 'Supplier updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Supplier $supplier)
    {
        if ($supplier->transactions()->exists()) {
            return $this->errorResponse('Cannot delete supplier with transaction history', 400);
        }

        $supplier->delete();

        return $this->successResponse(null, 'Supplier deleted successfully');
    }
}
