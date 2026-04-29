<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Promotion extends Model
{
    protected $fillable = [
        'product_id',
        'name',
        'image',
        'title',
        'subtitle',
        'description',
        'button_text',
        'button_link',
        'is_active',
        'start_date',
        'end_date',
        'start_datetime',
        'end_datetime',
        'order_number',
        'text_color',
        'background_color',
        'device_type',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'start_datetime' => 'datetime',
        'end_datetime' => 'datetime',
        'order_number' => 'integer',
    ];

    public function isValid(): bool
    {
        $now = now();
        
        // Check date fields
        if ($this->start_date && $now->lt($this->start_date)) {
            return false;
        }
        if ($this->end_date && $now->gt($this->end_date)) {
            return false;
        }
        
        // Check datetime fields
        if ($this->start_datetime && $now->lt($this->start_datetime)) {
            return false;
        }
        if ($this->end_datetime && $now->gt($this->end_datetime)) {
            return false;
        }
        
        return true;
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}

