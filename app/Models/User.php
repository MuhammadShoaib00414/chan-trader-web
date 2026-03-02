<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Passport\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable, TwoFactorAuthenticatable;

    const STATUS_ACTIVE = 1;

    const STATUS_INACTIVE = 0;

    const SOCIAL_PROVIDER_GOOGLE = 'google';

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
        'google_id',
        'apple_id',
        'social_provider',
        'status',
        'otp',
        'otp_expires_at',
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

    /**
     * Find user by Google ID
     */
    public static function findByGoogleId(string $googleId): ?User
    {
        return static::where('google_id', $googleId)->first();
    }

    /**
     * Find user by Apple ID
     */
    public static function findByAppleId(string $appleId): ?User
    {
        return static::where('apple_id', $appleId)->first();
    }

    /**
     * Find user by email for social login
     */
    public static function findByEmailForSocial(string $email): ?User
    {
        return static::where('email', $email)->first();
    }

    /**
     * Get the user's full name.
     */
    public function getNameAttribute(): string
    {
        return trim($this->first_name.' '.$this->last_name);
    }
}
