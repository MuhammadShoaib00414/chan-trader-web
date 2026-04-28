<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShopSale extends Model
{
    protected $fillable = [
        'customer_id',
        'created_by',
        'bill_no',
        'sale_date',
        'subtotal',
        'received_amount',
        'balance_due',
        'profit_amount',
        'payment_status',
        'notes',
    ];

    protected $casts = [
        'sale_date' => 'date',
        'subtotal' => 'float',
        'received_amount' => 'float',
        'balance_due' => 'float',
        'profit_amount' => 'float',
    ];

    public function customer()
    {
        return $this->belongsTo(ShopCustomer::class, 'customer_id');
    }

    public function items()
    {
        return $this->hasMany(ShopSaleItem::class, 'sale_id');
    }

    public function payments()
    {
        return $this->hasMany(ShopSalePayment::class, 'sale_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
