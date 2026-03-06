<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'store_id',
        'product_id',
        'product_variant_id',
        'name',
        'sku',
        'quantity',
        'unit_price',
        'subtotal',
        'status',
    ];
}
