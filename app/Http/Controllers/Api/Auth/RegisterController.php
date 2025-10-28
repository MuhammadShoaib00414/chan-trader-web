<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\AppBaseController;
use App\Http\Requests\Api\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Traits\IssueTokenTrait;
use App\Traits\OtpTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RegisterController extends AppBaseController
{
    use IssueTokenTrait, OtpTrait;

    /**
     * Register user
     *
     * @group Auth
     *
     * @bodyParam first_name string required User's first name. Example: John
     * @bodyParam last_name string required User's last name. Example: Doe
     * @bodyParam email string required User's email address. Example: john@example.com
     * @bodyParam password string required User's password (min 8 characters). Example: password123
     * @bodyParam password_confirmation string required Password confirmation. Example: password123
     * @bodyParam avatar file optional User's profile picture. Must be an image file (jpeg, png, jpg, gif) and max 1MB.
     * @bodyParam grant_type string required OAuth grant type. Example: password
     * @bodyParam client_id string required OAuth client ID. Example: 1
     * @bodyParam client_secret string required OAuth client secret. Example: your-client-secret
     *
     * @response 200 scenario="success" {
     *   "success": true,
     *   "message": "User registered successfully. Please check your email for OTP verification code.",
     *   "data": {
     *     "user": {
     *       "id": 1,
     *       "full_name": "John Doe",
     *       "first_name": "John",
     *       "last_name": "Doe",
     *       "email": "john@example.com",
     *       "avatar": "http://localhost/storage/avatars/example.jpg",
     *       "email_verified_at": null,
     *       "created_at": "2024-01-01T00:00:00.000000Z",
     *       "updated_at": "2024-01-01T00:00:00.000000Z"
     *     },
     *     "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
     *     "token_type": "Bearer",
     *     "expires_in": 31536000,
     *     "refresh_token": "def50200...",
     *     "otp": "1234",
     *   }
     * }
     * @response 422 scenario="validation error" {
     *   "success": false,
     *   "message": "The given data was invalid.",
     *   "data": {
     *     "email": ["The email has already been taken."]
     *   }
     * }
     *
     * @unauthenticated
     */
    public function register(RegisterRequest $request)
    {
        $response = DB::transaction(function () use ($request) {
            $userData = [
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'email' => $request->email,
                'password' => $request->password, // Password is automatically hashed by model casting
                'status' => User::STATUS_ACTIVE,
            ];

            // Handle avatar upload if provided
            if ($request->hasFile('avatar')) {
                $userData['avatar'] = $request->file('avatar')->store('avatars', 'public');
            }

            $user = User::create($userData);

            // Generate and save OTP
            $otp = $this->generateAndSaveOTP($user, 'verification');

            // Token generation
            $tokenRequest = new Request;
            $tokenRequest->merge([
                'grant_type' => 'password',
                'client_id' => $request->client_id,
                'client_secret' => $request->client_secret,
                'username' => $request->email,
                'password' => $request->password,
                'scope' => '',
            ]);

            $tokenResponse = $this->issueToken($tokenRequest);

            return [
                'user' => $user,
                'token' => $tokenResponse,
                'otp' => $otp,
            ];
        });

        return $this->successResponse([
            'user' => new UserResource($response['user']),
            'access_token' => $response['token']['access_token'],
            'token_type' => $response['token']['token_type'],
            'expires_in' => $response['token']['expires_in'],
            'refresh_token' => $response['token']['refresh_token'],
            'otp' => $response['otp'],
        ], 'User registered successfully. Please check your email for OTP verification code.');
    }
}
