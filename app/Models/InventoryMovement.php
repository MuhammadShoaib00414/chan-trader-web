<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryMovement extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'product_variant_id',
        'product_id',
        'qty',
        'type',
        'reason',
        'reference_id',
        'reference_type',
        'created_at',
    ];
}
