<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\AppBaseController;
use App\Http\Requests\Api\AppleLoginRequest;
use App\Http\Requests\Api\CheckUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Traits\IssueTokenTrait;
use Firebase\JWT\JWT;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SocialLoginController extends AppBaseController
{
    use IssueTokenTrait;

    // Google login functionality removed

    /**
     * Login with Apple
     *
     * @group Social
     *
     * @bodyParam identityToken string required Apple identity token from client. Example: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
     * @bodyParam authorizationCode string optional Apple authorization code. Example: c1234567890abcdef
     * @bodyParam grant_type string optional OAuth grant type. Example: password
     * @bodyParam client_id string required OAuth client ID. Example: 1
     * @bodyParam client_secret string required OAuth client secret. Example: your-client-secret
     *
     * @response 200 scenario="success" {
     *   "success": true,
     *   "message": "Apple login successful",
     *   "data": {
     *     "user": {
     *       "id": 1,
     *       "full_name": "John Doe",
     *       "first_name": "John",
     *       "last_name": "Doe",
     *       "email": "john@privaterelay.appleid.com",
     *       "apple_id": "000123.abc123def456",
     *       "social_provider": "apple",
     *       "email_verified_at": "2024-01-01T00:00:00.000000Z"
     *     },
     *     "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
     *     "token_type": "Bearer",
     *     "expires_in": 31536000,
     *     "refresh_token": "def50200..."
     *   }
     * }
     * @response 401 scenario="invalid token" {
     *   "success": false,
     *   "message": "Invalid Apple token",
     *   "data": null
     * }
     *
     * @unauthenticated
     */
    public function appleLogin(AppleLoginRequest $request)
    {
        // Verify Apple identity token
        $appleUser = $this->verifyAppleToken($request->identityToken);

        if (! $appleUser) {
            return $this->errorResponse('Invalid Apple token', 401);
        }

        // Check if user exists with Apple ID
        $user = User::findByAppleId($appleUser['sub']);

        if (! $user) {
            // For Apple, email is extracted from JWT token
            if ($appleUser['email']) {
                $user = User::findByEmailForSocial($appleUser['email']);
            }

            if ($user) {
                // Link Apple account to existing user
                $user->update([
                    'apple_id' => $appleUser['sub'],
                    'social_provider' => User::SOCIAL_PROVIDER_APPLE,
                ]);
            } else {
                // Check one more time if user exists by email before creating
                if ($appleUser['email']) {
                    $existingUser = User::where('email', $appleUser['email'])->first();
                    if ($existingUser) {
                        // Link Apple account to existing user
                        $existingUser->update([
                            'apple_id' => $appleUser['sub'],
                            'social_provider' => User::SOCIAL_PROVIDER_APPLE,
                        ]);
                        $user = $existingUser;
                    } else {
                        // Create new user
                        $user = $this->createUserFromApple($appleUser, $request->is_customer);
                    }
                } else {
                    // Create new user
                    $user = $this->createUserFromApple($appleUser, $request->is_customer);
                }
            }
        }

        // Generate token using Passport OAuth2 (same as login/register)
        $tokenRequest = new Request([
            'grant_type' => $request->grant_type ?? 'password',
            'client_id' => $request->client_id,
            'client_secret' => $request->client_secret,
            'username' => $user->email,
            'password' => 'social_login_temp_'.time(), // Temporary password for social login
            'scope' => '',
        ]);

        // Temporarily set a known password for OAuth2 flow
        $originalPassword = $user->password;
        $tempPassword = 'social_login_temp_'.time();
        $user->password = $tempPassword; // Password is automatically hashed by model casting
        $user->save();

        $tokenRequest->merge(['password' => $tempPassword]);
        $tokenResponse = $this->issueToken($tokenRequest);

        // Restore original password
        $user->password = $originalPassword;
        $user->save();

        return $this->successResponse([
            'user' => new UserResource($user),
            'access_token' => $tokenResponse['access_token'],
            'token_type' => $tokenResponse['token_type'],
            'expires_in' => $tokenResponse['expires_in'],
            'refresh_token' => $tokenResponse['refresh_token'] ?? null,
        ], 'Apple login successful');
    }

    /**
     * Check if user exists
     *
     * @group Social
     *
     * @bodyParam token string required Social login token (Google ID token or Apple identity token). Example: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
     * @bodyParam provider string required Social provider. Example: apple
     * @bodyParam grant_type string optional OAuth grant type. Example: password
     * @bodyParam client_id string deprecated
     * @bodyParam client_secret string deprecated
     *
     * @response 200 scenario="user found" {
     *   "success": true,
     *   "message": "User found",
     *   "data": {
     *     "user": {
     *       "id": 1,
     *       "full_name": "John Doe",
     *       "first_name": "John",
     *       "last_name": "Doe",
     *       "email": "john@gmail.com",
     *       "avatar": "https://lh3.googleusercontent.com/a/example.jpg",
     *       "google_id": "123456789",
     *       "social_provider": "google"
     *     },
     *     "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
     *     "token_type": "Bearer",
     *     "expires_in": 31536000,
     *     "refresh_token": "def50200..."
     *   }
     * }
     * @response 200 scenario="user not found" {
     *   "success": true,
     *   "message": "User not found",
     *   "data": null
     * }
     * @response 400 scenario="invalid token" {
     *   "success": false,
     *   "message": "Invalid Google token",
     *   "data": null
     * }
     *
     * @unauthenticated
     */
    public function checkUser(CheckUserRequest $request)
    {
        $token = $request->token;
        $provider = $request->provider;

        // Verify token and extract user data
        if ($provider === 'apple') {
            $tokenData = $this->verifyAppleToken($token);
            if (! $tokenData) {
                return $this->errorResponse('Invalid Apple token', 400);
            }

            // Find user by Apple ID or email
            $user = User::findByAppleId($tokenData['sub'])
                ?? User::findByEmailForSocial($tokenData['email'] ?? null);
        } else {
            return $this->errorResponse('Invalid provider', 400);
        }

        // Return user resource or null
        if ($user) {
            // Generate access token for the user
            $tokenRequest = new Request([
                'grant_type' => $request->grant_type ?? 'password',
                'client_id' => $request->client_id,
                'client_secret' => $request->client_secret,
                'username' => $user->email,
                'password' => 'social_login_temp_'.time(), // Temporary password for social login
                'scope' => '',
            ]);

            // Set temporary password for token generation
            $originalPassword = $user->password;
            $tempPassword = 'social_login_temp_'.time();
            $user->password = $tempPassword; // Password is automatically hashed by model casting
            $user->save();

            $tokenRequest->merge(['password' => $tempPassword]);
            $tokenResult = $this->issueToken($tokenRequest);

            // Restore original password
            $user->password = $originalPassword;
            $user->save();

            return $this->successResponse([
                'user' => new UserResource($user),
                'access_token' => $tokenResult['access_token'],
                'token_type' => $tokenResult['token_type'],
                'expires_in' => $tokenResult['expires_in'],
                'refresh_token' => $tokenResult['refresh_token'],
            ], 'User found');
        } else {
            return $this->successResponse(null, 'User not found');
        }
    }

    // Google token verification removed

    /**
     * Verify Apple identity token
     */
    private function verifyAppleToken(string $identityToken): ?array
    {
        // For now, we'll decode without verification for development
        // In production, you should implement proper JWT verification
        $tks = explode('.', $identityToken);

        if (count($tks) !== 3) {
            return null;
        }

        $payload = json_decode(JWT::urlsafeB64Decode($tks[1]), true);

        if (! $payload || ! isset($payload['sub'])) {
            return null;
        }

        // Basic validation
        if ($payload['iss'] !== 'https://appleid.apple.com') {
            return null;
        }

        return $payload;
    }

    /**
     * Create user from Google data
     */
    private function createUserFromGoogle(array $googleUser, bool $isCustomer): User
    {
        $firstName = $googleUser['given_name'] ?? 'Google';
        $lastName = $googleUser['family_name'] ?? 'User';

        $userData = [
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $googleUser['email'],
            'avatar' => $googleUser['picture'] ?? null,
            'google_id' => $googleUser['sub'],
            'social_provider' => User::SOCIAL_PROVIDER_GOOGLE,
            'email_verified_at' => now(), // Google emails are pre-verified
            'status' => User::STATUS_ACTIVE,
            'password' => Str::random(32), // Random password for social login - automatically hashed by model casting
        ];

        $user = User::create($userData);

        return $user;
    }

    /**
     * Create user from Apple data
     */
    private function createUserFromApple(array $appleUser, bool $isCustomer): User
    {
        // Extract name from JWT token if available
        $firstName = 'Apple';
        $lastName = 'User';

        // Apple JWT doesn't typically include name, but we can check if it does
        if (isset($appleUser['given_name'])) {
            $firstName = $appleUser['given_name'];
        }
        if (isset($appleUser['family_name'])) {
            $lastName = $appleUser['family_name'];
        }

        $userData = [
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $appleUser['email'] ?? 'apple_'.$appleUser['sub'].'@example.com',
            'apple_id' => $appleUser['sub'],
            'social_provider' => User::SOCIAL_PROVIDER_APPLE,
            'email_verified_at' => $appleUser['email'] ? now() : null, // Only verify if email is provided
            'status' => User::STATUS_ACTIVE,
            'password' => Str::random(32), // Random password for social login - automatically hashed by model casting
        ];

        $user = User::create($userData);

        return $user;
    }
}
