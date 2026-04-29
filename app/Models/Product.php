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
        'purchase_price',
        'stock',
        'low_stock_threshold',
        'compare_at',
        'unit',
        'warranty_months',
        'warranty_text',
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
        'price' => 'float',
        'purchase_price' => 'float',
        'compare_at' => 'float',
        'stock' => 'integer',
        'low_stock_threshold' => 'integer',
        'warranty_months' => 'integer',
        'is_published' => 'boolean',
        'is_featured' => 'boolean',
        'is_top_selling' => 'boolean',
        'rating_avg' => 'float',
        'rating_count' => 'integer',
        'published_at' => 'datetime',
    ];

    public function isLowStock()
    {
        return $this->stock <= $this->low_stock_threshold;
    }

    public function isOutOfStock(): bool
    {
        return $this->stock <= 0;
    }

    public function getDiscountedPriceAttribute(): float
    {
        return (float) $this->price;
    }

    public function getDiscountPercentAttribute(): ?int
    {
        $compareAt = (float) ($this->compare_at ?? 0);
        $price = (float) $this->price;

        if ($compareAt <= 0 || $compareAt <= $price) {
            return null;
        }

        return (int) round((($compareAt - $price) / $compareAt) * 100);
    }

    public function getStockStatusAttribute(): string
    {
        return $this->isOutOfStock() ? 'Out of Stock' : 'Available';
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

    public function reviews()
    {
        return $this->hasMany(ProductReview::class);
    }

    public function inventoryMovements()
    {
        return $this->hasMany(InventoryMovement::class);
    }
}
