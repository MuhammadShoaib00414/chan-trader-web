<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupplierTransaction extends Model
{
    protected $fillable = [
        'supplier_id',
        'store_id',
        'goods_value',
        'total_payable',
        'payment_duration',
        'installment_amount',
        'total_installments',
        'paid_installments',
        'status'
    ];

    protected $casts = [
        'goods_value' => 'decimal:2',
        'total_payable' => 'decimal:2',
        'installment_amount' => 'decimal:2',
        'store_id' => 'integer',
        'payment_duration' => 'integer',
        'total_installments' => 'integer',
        'paid_installments' => 'integer',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SupplierPayment::class);
    }

    public function getPaidAmountAttribute(): float
    {
        $payments = $this->relationLoaded('payments')
            ? $this->payments
            : $this->payments()->get(['amount']);

        return round((float) $payments->sum('amount'), 2);
    }

    public function getRemainingBalanceAttribute(): float
    {
        return round(max(0, (float) $this->total_payable - $this->paid_amount), 2);
    }

    public function getNextInstallmentAmountAttribute(): float
    {
        if ($this->paid_installments >= $this->total_installments) {
            return 0;
        }

        $remaining = $this->remaining_balance;

        if ($remaining <= (float) $this->installment_amount || $this->paid_installments + 1 === $this->total_installments) {
            return round($remaining, 2);
        }

        return round((float) $this->installment_amount, 2);
    }

    public function getNextInstallmentDueAttribute()
    {
        if ($this->paid_installments >= $this->total_installments) {
            return null;
        }

        return $this->created_at?->copy()->addWeeks($this->paid_installments + 1);
    }

    public function getProgressPercentageAttribute(): float
    {
        if ($this->total_installments === 0) {
            return 0;
        }

        return round(($this->paid_installments / $this->total_installments) * 100, 2);
    }
}
