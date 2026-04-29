<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryMovement extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'product_id',
        'qty',
        'type',
        'reason',
        'reference_id',
        'reference_type',
        'created_at',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
