<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SearchSuggestion extends Model
{
    protected $fillable = [
        'user_id',
        'query',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to get unique search queries for a user
     */
    public function scopeUniqueForUser($query, $userId)
    {
        return $query->where('user_id', $userId)
            ->distinct('query')
            ->orderBy('created_at', 'desc');
    }
}
