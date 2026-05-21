<?php

namespace App\Models;

use App\Enums\ContentPageSlug;
use Illuminate\Database\Eloquent\Model;

class ContentPage extends Model
{
    protected $fillable = [
        'slug',
        'title',
        'content',
        'is_published',
        'meta_title',
        'meta_description',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
        ];
    }

    public static function findBySlug(ContentPageSlug|string $slug): ?self
    {
        $value = $slug instanceof ContentPageSlug ? $slug->value : $slug;

        return static::query()->where('slug', $value)->first();
    }
}
