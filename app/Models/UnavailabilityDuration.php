<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UnavailabilityDuration extends Model
{
    protected $fillable = [
        'store_id',
        'start_at',
        'end_at',
        'reason',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
    ];

    public function store()
    {
        return $this->belongsTo(Store::class);
    }
}
