<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'store_id',
        'category_id',
        'subcategory_id',
        'brand_id',
        'name',
        'condition',
        'slug',
        'sku',
        'short_description',
        'description',
        'feature_image',
        'top_image',
        'price',
        'stock',
        'low_stock_threshold',
        'compare_at',
        'unit',
        'warranty_months',
        'meta_title',
        'meta_description',
        'is_published',
        'is_featured',
        'is_top_selling',
        'published_at',
        'rating_avg',
        'rating_count',
    ];

    protected $casts = [
        'stock' => 'integer',
        'low_stock_threshold' => 'integer',
        'is_published' => 'boolean',
        'is_featured' => 'boolean',
        'is_top_selling' => 'boolean',
        'published_at' => 'datetime',
    ];

    public function isLowStock()
    {
        return $this->stock <= $this->low_stock_threshold;
    }

    public function scopeLowStock($query)
    {
        return $query->whereRaw('stock <= low_stock_threshold');
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function subcategory()
    {
        return $this->belongsTo(Subcategory::class);
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }
}
