<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShopSalePayment extends Model
{
    protected $fillable = [
        'sale_id',
        'customer_id',
        'created_by',
        'amount',
        'method',
        'payment_date',
        'note',
    ];

    protected $casts = [
        'amount' => 'float',
        'payment_date' => 'date',
    ];

    public function sale()
    {
        return $this->belongsTo(ShopSale::class, 'sale_id');
    }

    public function customer()
    {
        return $this->belongsTo(ShopCustomer::class, 'customer_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
