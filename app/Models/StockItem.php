<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockItem extends Model
{
    protected $fillable = [
        'item_name',
        'purchase_price',
        'selling_price',
        'created_by',
    ];

    protected $casts = [
        'purchase_price' => 'float',
        'selling_price' => 'float',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
