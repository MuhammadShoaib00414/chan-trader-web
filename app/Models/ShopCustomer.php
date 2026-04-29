<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShopCustomer extends Model
{
    protected $fillable = [
        'name',
        'phone',
        'address',
        'notes',
    ];

    public function sales()
    {
        return $this->hasMany(ShopSale::class, 'customer_id');
    }

    public function payments()
    {
        return $this->hasMany(ShopSalePayment::class, 'customer_id');
    }
}
