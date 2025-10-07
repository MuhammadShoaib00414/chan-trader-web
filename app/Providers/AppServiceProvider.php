<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Passport;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Set key paths first
        Passport::loadKeysFrom(storage_path());

        // Enable grants
        Passport::enablePasswordGrant();

        // Access token expires in 1 day (24 hours = 1440 minutes)
        Passport::tokensExpireIn(now()->addMinutes(1440));

        // Refresh token expires in 7 days (7 * 24 hours = 10080 minutes)
        Passport::refreshTokensExpireIn(now()->addMinutes(10080));
    }
}
