<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shipment extends Model
{
    protected $fillable = [
        'order_id',
        'store_id',
        'carrier',
        'tracking_no',
        'status',
        'shipped_at',
        'delivered_at',
        'cost',
    ];

    protected $casts = [
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];
}
