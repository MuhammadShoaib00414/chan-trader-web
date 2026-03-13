<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\AppBaseController;
use App\Http\Requests\Api\LoginRequest;
use App\Http\Requests\Api\RefreshTokenRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Traits\IssueTokenTrait;
use App\Traits\OtpTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class LoginController extends AppBaseController
{
    use IssueTokenTrait, OtpTrait;

    /**
     * Login user
     *
     * @group Auth
     *
     * @bodyParam email string required User's email address. Example: john@example.com
     * @bodyParam password string required User's password. Example: password123
     * Grant type is handled on the server.
     *
     * @response 200 scenario="success" {
     *   "success": true,
     *   "message": "User logged in successfully",
     *   "data": {
     *     "user": {
     *       "id": 1,
     *       "full_name": "John Doe",
     *       "first_name": "John",
     *       "last_name": "Doe",
     *       "email": "john@example.com",
     *       "avatar": "http://localhost/storage/avatars/example.jpg",
     *       "email_verified_at": "2024-01-01T00:00:00.000000Z",
     *       "created_at": "2024-01-01T00:00:00.000000Z",
     *       "updated_at": "2024-01-01T00:00:00.000000Z"
     *     },
     *     "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
     *     "token_type": "Bearer",
     *     "expires_in": 31536000,
     *     "refresh_token": "def50200..."
     *   }
     * }
     * @response 401 scenario="invalid credentials" {
     *   "success": false,
     *   "message": "The provided credentials are incorrect.",
     *   "data": null
     * }
     * @response 403 scenario="email not verified" {
     *   "success": false,
     *   "message": "Email not verified. Please verify your email first.",
     *   "data": {
     *     "verification_required": true,
     *     "email": "john@example.com",
     *     "otp": "1234",
     *     "instructions": "A new OTP has been sent to your email address."
     *   }
     * }
     *
     * @unauthenticated
     */
    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return $this->errorResponse('The provided credentials are incorrect.', 401);
        }

        if (! $user->email_verified_at) {
            // Generate and send new OTP
            $otp = $this->generateAndSaveOTP($user, 'verification');

            return $this->errorResponse('Email not verified. Please verify your email first.', 403, [
                'verification_required' => true,
                'email' => $user->email,
                'otp' => $otp,
                'instructions' => 'A new OTP has been sent to your email address.',
            ]);
        }

        $tokenResponse = $this->issueToken($request);

        return $this->successResponse([
            'user' => new UserResource($user),
            'access_token' => $tokenResponse['access_token'],
            'token_type' => $tokenResponse['token_type'],
            'expires_in' => $tokenResponse['expires_in'],
            'refresh_token' => $tokenResponse['refresh_token'],
        ], 'User logged in successfully');
    }

    /**
     * Logout user
     *
     * @group Auth
     *
     * @response 200 scenario="success" {
     *   "success": true,
     *   "message": "Successfully logged out",
     *   "data": null
     * }
     *
     * @authenticated
     */
    public function logout(Request $request)
    {
        // Revoke the access token
        $request->user()->token()->revoke();

        return $this->successResponse(null, 'Successfully logged out');
    }

    /**
     * Refresh token
     *
     * @group Auth
     *
     * Grant type is handled on the server.
     *
     * @bodyParam refresh_token string required Valid refresh token. Example: def50200...
     *
     * @response 200 scenario="success" {
     *   "success": true,
     *   "message": "Token refreshed successfully",
     *   "data": {
     *     "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
     *     "token_type": "Bearer",
     *     "expires_in": 31536000,
     *     "refresh_token": "def50200..."
     *   }
     * }
     * @response 401 scenario="invalid refresh token" {
     *   "success": false,
     *   "message": "Token refresh failed: The refresh token is invalid.",
     *   "data": null
     * }
     *
     * @unauthenticated
     */
    public function refresh(RefreshTokenRequest $request)
    {
        $request->merge(['grant_type' => 'refresh_token']);
        $tokenResponse = $this->issueToken($request);

        return $this->successResponse([
            'access_token' => $tokenResponse['access_token'],
            'token_type' => $tokenResponse['token_type'],
            'expires_in' => $tokenResponse['expires_in'],
            'refresh_token' => $tokenResponse['refresh_token'],
        ], 'Token refreshed successfully');
    }
}
