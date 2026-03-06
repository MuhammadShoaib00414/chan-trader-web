<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductVariant extends Model
{
    protected $fillable = [
        'product_id',
        'sku',
        'variant_key',
        'price',
        'compare_at',
        'stock',
        'weight',
        'length',
        'width',
        'height',
        'is_active',
    ];
}
