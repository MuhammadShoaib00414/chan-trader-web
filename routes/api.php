<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// ********************* Auth routes *********************

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/refresh', [AuthController::class, 'refresh']);
/**
 * OAuth Token Endpoint (Internal)
 *
 * @group Internal
 *
 * @subgroup OAuth
 *
 * Laravel Passport OAuth2 token endpoint for generating access tokens.
 * This is an internal endpoint used by the auth system and should not be called directly by clients.
 * Use the specific auth endpoints (register, login, refresh) instead.
 *
 * @hideFromAPIDocumentation
 */
Route::post('/oauth/token', [\Laravel\Passport\Http\Controllers\AccessTokenController::class, 'issueToken']);
Route::post('/password/reset', [PasswordResetController::class, 'resetPassword']);

// Social login routes
Route::post('/auth/google', [AuthController::class, 'googleLogin']);
Route::post('/auth/apple', [AuthController::class, 'appleLogin']);
Route::post('/auth/check-user', [AuthController::class, 'checkUser']);

Route::prefix('otp')->group(function () {
    // Email verification
    Route::post('/email/send', [AuthController::class, 'sendEmailVerificationOTP']);
    Route::post('/email/verify', [AuthController::class, 'verifyEmail']);

    // Password reset
    Route::post('/password/send', [AuthController::class, 'sendPasswordResetOTP']);
    Route::post('/password/verify', [AuthController::class, 'verifyPasswordResetOTP']);
});

// Password change (requires authentication)
Route::middleware('auth:api')->group(function () {
    Route::post('/password/change', [AuthController::class, 'changePassword'])
        ->middleware('throttle:5,1'); // Limit to 5 attempts per minute
});

// ********************* End Auth routes *********************

/**
 * Get authenticated user
 *
 * @group Authentication
 *
 * @subgroup User Management
 *
 * Get the currently authenticated user's information.
 *
 * @response 200 scenario="success" {
 *   "id": 1,
 *   "first_name": "John",
 *   "last_name": "Doe",
 *   "email": "john@example.com",
 *   "avatar": "http://localhost/storage/avatars/example.jpg",
 *   "email_verified_at": "2024-01-01T00:00:00.000000Z",
 *   "created_at": "2024-01-01T00:00:00.000000Z",
 *   "updated_at": "2024-01-01T00:00:00.000000Z"
 * }
 * @response 401 scenario="unauthenticated" {
 *   "message": "Unauthenticated."
 * }
 *
 * @authenticated
 */
Route::get('/user', function (Request $request) {
    return UserResource::make($request->user());
})->middleware('auth:api');
