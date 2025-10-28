<?php

use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Auth\OtpController;
use App\Http\Controllers\Api\Auth\PasswordController;
use App\Http\Controllers\Api\Auth\RegisterController;
use App\Http\Controllers\Api\Auth\SocialLoginController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// ********************* Auth routes *********************

// Registration
Route::post('/register', [RegisterController::class, 'register']);

// Login/Logout
Route::post('/login', [LoginController::class, 'login']);
Route::post('/refresh', [LoginController::class, 'refresh']);

/**
 * OAuth Token Endpoint (Internal)
 *
 * @group Internal
 *
 * Laravel Passport OAuth2 token endpoint for generating access tokens.
 * This is an internal endpoint used by the auth system and should not be called directly by clients.
 * Use the specific auth endpoints (register, login, refresh) instead.
 *
 * @hideFromAPIDocumentation
 */
Route::post('/oauth/token', [\Laravel\Passport\Http\Controllers\AccessTokenController::class, 'issueToken']);

// Social login routes
Route::post('/auth/google', [SocialLoginController::class, 'googleLogin']);
Route::post('/auth/apple', [SocialLoginController::class, 'appleLogin']);
Route::post('/auth/check-user', [SocialLoginController::class, 'checkUser']);

// OTP routes
Route::prefix('otp')->group(function () {
    Route::post('/email/send', [OtpController::class, 'sendEmailVerificationOTP']);
    Route::post('/password/send', [OtpController::class, 'sendPasswordResetOTP']);
    Route::post('/email/verify', [OtpController::class, 'verifyEmail']);
    Route::post('/password/verify', [OtpController::class, 'verifyPasswordResetOTP']);
});

// Password management
Route::post('/password/reset', [PasswordController::class, 'resetPassword']);

// Password change (requires authentication)
Route::middleware(['auth:api', 'verified'])->group(function () {
    Route::post('/password/change', [PasswordController::class, 'changePassword'])
        ->middleware('throttle:5,1'); // Limit to 5 attempts per minute

    // ********************* End Auth routes *********************

    Route::group(['prefix' => 'user'], function () {
        Route::get('/', [UserController::class, 'me']);
        Route::post('/logout', [LoginController::class, 'logout']);
    });
});
