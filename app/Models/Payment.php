<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'order_id',
        'method',
        'amount',
        'status',
        'provider_txn_id',
        'paid_at',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
    ];
}
