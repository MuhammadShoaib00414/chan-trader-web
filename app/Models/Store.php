<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Store extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'owner_id',
        'name',
        'slug',
        'logo',
        'banner',
        'email',
        'phone',
        'description',
        'socials',
        'rating_avg',
        'followers_count',
        'products_count',
        'status',
        'verified_at',
    ];

    protected $casts = [
        'socials' => 'array',
        'verified_at' => 'datetime',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }
}
