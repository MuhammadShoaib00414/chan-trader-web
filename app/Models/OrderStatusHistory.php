<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderStatusHistory extends Model
{
    public $timestamps = false;

    protected $table = 'order_status_history';

    protected $fillable = [
        'order_id',
        'store_id',
        'from_status',
        'to_status',
        'changed_by',
        'comment',
        'created_at',
    ];
}
