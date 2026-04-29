<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Passport\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable, SoftDeletes, TwoFactorAuthenticatable;

    const STATUS_ACTIVE = 1;

    const STATUS_INACTIVE = 0;

    const SOCIAL_PROVIDER_APPLE = 'apple';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'pending_email',
        'password',
        'avatar',
        'cover_image',
        'apple_id',
        'social_provider',
        'status',
        'otp',
        'otp_expires_at',
        // new registration fields
        'phone_number',
        'shop_name',
        'city_district',
        'address',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'name',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'remember_token' => 'hashed',
            'otp' => 'hashed',
            'otp_expires_at' => 'datetime',
        ];
    }

    // Google login support removed

    /**
     * Find user by Apple ID
     */
    public static function findByAppleId(string $appleId): ?User
    {
        return static::where('apple_id', $appleId)->first();
    }

    /**
     * Get the guard name for the user.
     */
    public function guardName(): string
    {
        return 'web';
    }

    public function addresses()
    {
        return $this->hasMany(Address::class);
    }

    public function reviews()
    {
        return $this->hasMany(ProductReview::class);
    }

    public function cartItems()
    {
        return $this->hasMany(CartItem::class);
    }

    public function wishlistItems()
    {
        return $this->hasMany(WishlistItem::class);
    }

    public function messagesSent()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function messagesReceived()
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Get the user's full name.
     */
    public function getNameAttribute(): string
    {
        return trim($this->first_name.' '.$this->last_name);
    }

    /**
     * Get the account deletion reason for the user.
     */
    public function accountDeletionReason()
    {
        return $this->hasOne(AccountDeletionReason::class);
    }

    protected static function booted(): void
    {
        static::deleting(function (User $user) {
            if ($user->isForceDeleting()) {
                return;
            }

            // Prefix "delete." to existing email
            $newEmail = 'delete.'.$user->email;

            static::withoutEvents(function () use ($user, $newEmail) {
                static::whereKey($user->getKey())->update([
                    'email' => $newEmail,
                ]);
            });

            // Update model instance
            $user->email = $newEmail;
        });
    }
}
