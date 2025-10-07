<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Passport\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, TwoFactorAuthenticatable;

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
}
