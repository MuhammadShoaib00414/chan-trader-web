<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShopSaleItem extends Model
{
    protected $fillable = [
        'sale_id',
        'product_id',
        'quantity',
        'unit_price',
        'unit_cost',
        'line_total',
        'profit_amount',
    ];

    protected $casts = [
        'unit_price' => 'float',
        'unit_cost' => 'float',
        'line_total' => 'float',
        'profit_amount' => 'float',
    ];

    public function sale()
    {
        return $this->belongsTo(ShopSale::class, 'sale_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
