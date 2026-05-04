<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockItem extends Model
{
    protected $fillable = [
        'item_name',
        'batch_lot_number',
        'purchase_price',
        'selling_price',
        'quantity',
        'created_by',
    ];

    protected $casts = [
        'purchase_price' => 'float',
        'selling_price' => 'float',
        'quantity' => 'integer',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
