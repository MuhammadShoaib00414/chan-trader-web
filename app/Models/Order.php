<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'code',
        'status',
        'shipping_address_id',
        'currency',
        'subtotal',
        'shipping_cost',
        'discount_total',
        'tax_total',
        'grand_total',
        'payment_status',
        'notes',
    ];
}
