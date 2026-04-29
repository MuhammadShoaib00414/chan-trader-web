<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    public const CATEGORY_LOCAL = 'local';
    public const CATEGORY_IMPORTED = 'imported';
    public const CATEGORY_WHOLESALE = 'wholesale';

    public const CATEGORIES = [
        self::CATEGORY_LOCAL,
        self::CATEGORY_IMPORTED,
        self::CATEGORY_WHOLESALE,
    ];

    protected $fillable = ['name', 'email', 'phone', 'address', 'category'];

    public function stores(): BelongsToMany
    {
        return $this->belongsToMany(Store::class)
            ->withTimestamps()
            ->orderBy('name');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(SupplierTransaction::class);
    }
}
