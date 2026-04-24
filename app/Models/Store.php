<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
        'business_whatsapp_url',
        'description',
        'address',
        'city',
        'socials',
        'rating_avg',
        'followers_count',
        'products_count',
        'status',
        'verified_at',
    ];

    protected $casts = [
        'socials' => 'array',
        'rating_avg' => 'float',
        'followers_count' => 'integer',
        'products_count' => 'integer',
        'verified_at' => 'datetime',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function unavailabilityDurations()
    {
        return $this->hasMany(UnavailabilityDuration::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
