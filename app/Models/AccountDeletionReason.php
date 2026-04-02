<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccountDeletionReason extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'reason',
    ];

    /**
     * Get the user that owns the account deletion reason.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}