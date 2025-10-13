<?php

namespace App\Http\Controllers\Api;

use App\Enums\OtpType;
use App\Http\Controllers\AppBaseController;
use App\Http\Requests\Api\AppleLoginRequest;
use App\Http\Requests\Api\CheckUserRequest;
use App\Http\Requests\Api\GoogleLoginRequest;
use App\Http\Requests\Api\LoginRequest;
use App\Http\Requests\Api\RefreshTokenRequest;
use App\Http\Requests\Api\RegisterRequest;
use App\Http\Requests\Api\SendOtpRequest;
use App\Http\Requests\Api\VerifyEmailRequest;
use App\Http\Requests\Api\VerifyPasswordResetOtpRequest;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Traits\IssueTokenTrait;
use App\Traits\OtpTrait;
use Firebase\JWT\JWT;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AuthController extends AppBaseController
{
    use IssueTokenTrait, OtpTrait;

    /**
     * Register a new user
     *
     * @group Authentication
     *
     * Register a new user account with the provided information.
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
     *   "message": "User registered successfully",
     *   "data": {
     *     "user": {
     *       "id": 1,
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
     *     "message": "Please check your email for OTP verification code."
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
        try {
            $response = DB::transaction(function () use ($request) {
                $userData = [
                    'first_name' => $request->first_name,
                    'last_name' => $request->last_name,
                    'email' => $request->email,
                    'password' => Hash::make($request->password),
                    'status' => User::STATUS_ACTIVE,
                ];

                // Handle avatar upload if provided
                if ($request->hasFile('avatar')) {
                    $userData['avatar'] = $request->file('avatar')->store('avatars', 'public');
                }

                $user = User::create($userData);

                // Generate and save OTP
                $otp = $this->generateAndSaveOTP($user, 'verification');

                // Log OTP for development
                Log::info('OTP Generated for Registration', [
                    'email' => $user->email,
                    'otp' => $otp,
                ]);

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
                    'otp' => $otp, // Temporary - will be removed later
                ];
            });

            return $this->successResponse([
                'user' => new UserResource($response['user']),
                'access_token' => $response['token']['access_token'],
                'token_type' => $response['token']['token_type'],
                'expires_in' => $response['token']['expires_in'],
                'refresh_token' => $response['token']['refresh_token'],
                'otp' => $response['otp'], // Temporary - will be removed later
                'message' => 'Please check your email for OTP verification code.',
            ], 'User registered successfully');

        } catch (\Exception $e) {
            Log::error('Registration failed: '.$e->getMessage(), [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse('Registration failed: '.$e->getMessage(), 500);
        }
    }

    /**
     * Login user and create token
     *
     * @group Authentication
     *
     * Authenticate a user and return an access token.
     *
     * @bodyParam email string required User's email address. Example: john@example.com
     * @bodyParam password string required User's password. Example: password123
     * @bodyParam grant_type string required OAuth grant type. Example: password
     * @bodyParam client_id string required OAuth client ID. Example: 1
     * @bodyParam client_secret string required OAuth client secret. Example: your-client-secret
     *
     * @response 200 scenario="success" {
     *   "success": true,
     *   "message": "User logged in successfully",
     *   "data": {
     *     "user": {
     *       "id": 1,
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

        try {
            $user = User::where('email', $request->email)->first();

            if (! $user || ! Hash::check($request->password, $user->password)) {
                return $this->errorResponse('The provided credentials are incorrect.', 401);
            }

            if (! $user->email_verified_at) {
                // Generate and send new OTP
                $otp = $this->generateAndSaveOTP($user, 'verification');

                // Log OTP for development
                Log::info('OTP Generated for Login (Email Not Verified)', [
                    'email' => $user->email,
                    'otp' => $otp,
                ]);

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
        } catch (\Exception $e) {
            return $this->errorResponse('Login failed: '.$e->getMessage(), 500);
        }
    }

    /**
     * Logout user (Revoke the token)
     *
     * @group Authentication
     *
     * Revoke the current user's access token.
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
     * @group Authentication
     *
     * Refresh an expired access token using a refresh token.
     *
     * @bodyParam grant_type string required OAuth grant type. Example: refresh_token
     * @bodyParam client_id string required OAuth client ID. Example: 1
     * @bodyParam client_secret string required OAuth client secret. Example: your-client-secret
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

        try {
            $tokenResponse = $this->issueToken($request);

            return $this->successResponse([
                'access_token' => $tokenResponse['access_token'],
                'token_type' => $tokenResponse['token_type'],
                'expires_in' => $tokenResponse['expires_in'],
                'refresh_token' => $tokenResponse['refresh_token'],
            ], 'Token refreshed successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Token refresh failed: '.$e->getMessage(), 500);
        }
    }

    /**
     * Send OTP for various verification purposes
     *
     * @return \Illuminate\Http\JsonResponse
     */
    private function sendOTP(Request $request, OtpType $type)
    {

        try {
            $user = User::where('email', $request->email)->first();

            if (! $user) {
                return $this->errorResponse('User not found', 404);
            }

            $isVerified = ! is_null($user->email_verified_at);

            // If updated email verification is required and old email is already verified, send new OTP
            if ($type === OtpType::EMAIL_VERIFICATION && $isVerified && $user->pending_email) {
                $otp = $this->generateAndSaveOTP($user, OtpType::EMAIL_VERIFICATION->value, $user->pending_email);

                // Log OTP for development
                Log::info('OTP Generated for Pending Email Verification', [
                    'email' => $user->email,
                    'pending_email' => $user->pending_email,
                    'otp' => $otp,
                ]);

                return $this->successResponse([
                    'user' => new UserResource($user),
                    'pending_email' => $user->pending_email,
                    'requires_verification' => true,
                    'otp' => $otp,
                ], 'Please verify your new email address. A verification code has been sent.');
            }

            // For email verification request, check if already verified
            if ($type === OtpType::EMAIL_VERIFICATION && $isVerified) {
                return $this->errorResponse('Email already verified', 400);
            }

            // If email verification is required but not verified, send verification OTP instead
            if ($type->requiresVerifiedEmail() && ! $isVerified) {
                $otp = $this->generateAndSaveOTP($user, OtpType::EMAIL_VERIFICATION->value);

                // Log OTP for development
                Log::info('OTP Generated (Email Verification Required)', [
                    'email' => $user->email,
                    'otp' => $otp,
                    'requested_type' => $type->value,
                ]);

                return $this->successResponse([
                    'message' => 'Please verify your email first. A new verification code has been sent to your email.',
                    'email' => $user->email,
                    'requires_email_verification' => true,
                    'otp' => $otp,
                ], 200);
            }

            // Proceed with the original OTP request
            $otp = $this->generateAndSaveOTP($user, $type->value);

            // Log OTP for development
            Log::info('OTP Generated', [
                'email' => $user->email,
                'otp' => $otp,
                'type' => $type->value,
            ]);

            return $this->successResponse([
                'message' => $type->getMessage(),
                'email' => $user->email,
                'otp' => $otp,
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse(
                "Failed to send {$type->getErrorPrefix()}: ".$e->getMessage(),
                500
            );
        }
    }

    /**
     * Send OTP for email verification after registration
     *
     * @group Authentication
     *
     * @subgroup OTP Verification
     *
     * Send a verification OTP to the user's email address.
     *
     * @bodyParam email string required User's email address. Example: john@example.com
     *
     * @response 200 scenario="success" {
     *   "success": true,
     *   "message": "Verification code has been sent to your email",
     *   "data": {
     *     "message": "Verification code has been sent to your email",
     *     "email": "john@example.com",
     *     "otp": "1234"
     *   }
     * }
     * @response 404 scenario="user not found" {
     *   "success": false,
     *   "message": "User not found",
     *   "data": null
     * }
     * @response 400 scenario="already verified" {
     *   "success": false,
     *   "message": "Email already verified",
     *   "data": null
     * }
     *
     * @unauthenticated
     */
    public function sendEmailVerificationOTP(SendOtpRequest $request)
    {
        return $this->sendOTP($request, OtpType::EMAIL_VERIFICATION);
    }

    /**
     * Send OTP for password reset
     *
     * @group Authentication
     *
     * @subgroup OTP Verification
     *
     * Send a password reset OTP to the user's email address.
     *
     * @bodyParam email string required User's email address. Example: john@example.com
     *
     * @response 200 scenario="success" {
     *   "success": true,
     *   "message": "Password reset code has been sent to your email",
     *   "data": {
     *     "message": "Password reset code has been sent to your email",
     *     "email": "john@example.com",
     *     "otp": "1234"
     *   }
     * }
     * @response 404 scenario="user not found" {
     *   "success": false,
     *   "message": "User not found",
     *   "data": null
     * }
     * @response 400 scenario="email not verified" {
     *   "success": false,
     *   "message": "Please verify your email first. A new verification code has been sent to your email.",
     *   "data": {
     *     "message": "Please verify your email first. A new verification code has been sent to your email.",
     *     "email": "john@example.com",
     *     "requires_email_verification": true,
     *     "otp": "1234"
     *   }
     * }
     *
     * @unauthenticated
     */
    public function sendPasswordResetOTP(SendOtpRequest $request)
    {
        return $this->sendOTP($request, OtpType::PASSWORD_RESET);
    }

    /**
     * Verify email with OTP after registration
     *
     * @group Authentication
     *
     * @subgroup OTP Verification
     *
     * Verify user's email address using the OTP sent to their email.
     *
     * @bodyParam email string required User's email address. Example: john@example.com
     * @bodyParam otp string required 4-digit OTP code. Example: 1234
     * @bodyParam grant_type string optional OAuth grant type. Example: password
     * @bodyParam client_id string optional OAuth client ID. Example: 1
     * @bodyParam client_secret string optional OAuth client secret. Example: your-client-secret
     * @bodyParam password string optional User's password (required for token generation). Example: password123
     *
     * @response 200 scenario="success" {
     *   "success": true,
     *   "message": "Email verified successfully",
     *   "data": {
     *     "user": {
     *       "id": 1,
     *       "first_name": "John",
     *       "last_name": "Doe",
     *       "email": "john@example.com",
     *       "email_verified_at": "2024-01-01T00:00:00.000000Z"
     *     },
     *     "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
     *     "token_type": "Bearer",
     *     "expires_in": 31536000,
     *     "refresh_token": "def50200..."
     *   }
     * }
     * @response 404 scenario="user not found" {
     *   "success": false,
     *   "message": "User not found",
     *   "data": null
     * }
     * @response 400 scenario="invalid otp" {
     *   "success": false,
     *   "message": "Invalid OTP",
     *   "data": null
     * }
     *
     * @unauthenticated
     */
    public function verifyEmail(VerifyEmailRequest $request)
    {
        try {
            $user = User::where('email', $request->email)
                ->orWhere('pending_email', $request->email)
                ->first();

            if (! $user) {
                return $this->errorResponse('User not found', 404);
            }

            // Check if verifying pending email change
            $isVerifyingPendingEmail = $user->pending_email === $request->email;

            if (! $isVerifyingPendingEmail && $user->email_verified_at) {
                return $this->errorResponse('Email already verified', 400);
            }

            [$isValid, $error] = $this->verifyUserOTP($user, $request->otp);

            if (! $isValid) {
                return $this->errorResponse($error, 400);
            }

            // If verifying pending email, update the main email
            if ($isVerifyingPendingEmail) {
                $user->email = $user->pending_email;
                $user->pending_email = null;
                $user->email_verified_at = now();
            } else {
                // Mark email as verified for new registration
                $user->email_verified_at = now();
            }

            $user->otp = null;
            $user->otp_expires_at = null;
            $user->save();

            try {

                $tokenRequest = new Request([
                    'grant_type' => $request->grant_type ?? 'password',
                    'client_id' => $request->client_id,
                    'client_secret' => $request->client_secret,
                    'username' => $request->email,
                    'password' => $request->password,
                    'scope' => '',
                ]);

                $tokenResponse = $this->issueToken($tokenRequest);

                return $this->successResponse([
                    'user' => new UserResource($user),
                    'access_token' => $tokenResponse['access_token'],
                    'token_type' => $tokenResponse['token_type'],
                    'expires_in' => $tokenResponse['expires_in'],
                    'refresh_token' => $tokenResponse['refresh_token'],
                ], 'Email verified successfully');

            } catch (\Exception $e) {
                return $this->errorResponse('Email verified but token generation failed: '.$e->getMessage(), 500);
            }

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to verify email: '.$e->getMessage(), 500);
        }
    }

    /**
     * Verify OTP for password reset
     *
     * @group Authentication
     *
     * @subgroup OTP Verification
     *
     * Verify the OTP for password reset and get a reset token.
     *
     * @bodyParam email string required User's email address. Example: john@example.com
     * @bodyParam otp string required 4-digit OTP code. Example: 1234
     *
     * @response 200 scenario="success" {
     *   "success": true,
     *   "message": "OTP verified successfully",
     *   "data": {
     *     "user": {
     *       "id": 1,
     *       "first_name": "John",
     *       "last_name": "Doe",
     *       "email": "john@example.com"
     *     },
     *     "reset_token": "abc123def456ghi789"
     *   }
     * }
     * @response 400 scenario="invalid otp" {
     *   "success": false,
     *   "message": "Invalid OTP",
     *   "data": null
     * }
     * @response 400 scenario="email not verified" {
     *   "success": false,
     *   "message": "Please verify your email first",
     *   "data": null
     * }
     *
     * @unauthenticated
     */
    public function verifyPasswordResetOTP(VerifyPasswordResetOtpRequest $request)
    {

        try {
            $user = User::where('email', $request->email)->first();

            if (! $user->email_verified_at) {
                return $this->errorResponse('Please verify your email first', 400);
            }

            [$isValid, $error] = $this->verifyUserOTP($user, $request->otp);

            if (! $isValid) {
                return $this->errorResponse($error, 400);
            }

            // Generate reset token
            $reset_token = Str::random(60);

            $user->update([
                'otp' => null,
                'otp_expires_at' => null,
                'remember_token' => Hash::make($reset_token),
            ]);

            return $this->successResponse([
                'user' => new UserResource($user),
                'reset_token' => $reset_token,
            ], 'OTP verified successfully');

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to verify OTP: '.$e->getMessage(), 500);
        }
    }

    /**
     * Change user password
     *
     * @group Authentication
     *
     * @subgroup Password Management
     *
     * Change the authenticated user's password.
     *
     * @bodyParam current_password string required Current password. Example: oldpassword123
     * @bodyParam new_password string required New password (min 8 characters). Example: newpassword123
     * @bodyParam new_password_confirmation string required New password confirmation. Example: newpassword123
     *
     * @response 200 scenario="success" {
     *   "success": true,
     *   "message": "Password changed successfully",
     *   "data": {
     *     "message": "Password changed successfully. Please log in again."
     *   }
     * }
     * @response 422 scenario="validation error" {
     *   "success": false,
     *   "message": "The given data was invalid.",
     *   "data": {
     *     "current_password": ["The current password is incorrect."]
     *   }
     * }
     *
     * @authenticated
     */
    public function changePassword(ChangePasswordRequest $request)
    {
        try {
            $user = $request->user('api');

            // Update the user's password
            $user->update([
                'password' => Hash::make($request->new_password),
            ]);

            // Revoke all existing tokens for security
            $user->tokens()->delete();

            return $this->successResponse([
                'message' => 'Password changed successfully. Please log in again.',
            ], 'Password changed successfully');

        } catch (\Exception $e) {
            Log::error('Password change failed', [
                'user_id' => $request->user('api')->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse('Failed to change password. Please try again.', 500);
        }
    }

    /**
     * Login with Google
     *
     * @group Authentication
     *
     * @subgroup Social Login
     *
     * Authenticate a user using Google OAuth.
     *
     * @bodyParam idToken string required Google ID token from client. Example: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
     * @bodyParam grant_type string optional OAuth grant type. Example: password
     * @bodyParam client_id string required OAuth client ID. Example: 1
     * @bodyParam client_secret string required OAuth client secret. Example: your-client-secret
     *
     * @response 200 scenario="success" {
     *   "success": true,
     *   "message": "Google login successful",
     *   "data": {
     *     "user": {
     *       "id": 1,
     *       "first_name": "John",
     *       "last_name": "Doe",
     *       "email": "john@gmail.com",
     *       "avatar": "https://lh3.googleusercontent.com/a/example.jpg",
     *       "google_id": "123456789",
     *       "social_provider": "google",
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
     *   "message": "Invalid Google token",
     *   "data": null
     * }
     *
     * @unauthenticated
     */
    public function googleLogin(GoogleLoginRequest $request)
    {
        try {
            // Verify Google ID token
            $googleUser = $this->verifyGoogleToken($request->idToken);

            if (! $googleUser) {
                return $this->errorResponse('Invalid Google token', 401);
            }

            // Check if user exists with Google ID
            $user = User::findByGoogleId($googleUser['sub']);

            if (! $user) {
                // Check if user exists with email
                $user = User::findByEmailForSocial($googleUser['email']);

                if ($user) {
                    // Link Google account to existing user
                    $user->update([
                        'google_id' => $googleUser['sub'],
                        'social_provider' => User::SOCIAL_PROVIDER_GOOGLE,
                    ]);
                } else {
                    // Create new user
                    $user = $this->createUserFromGoogle($googleUser, $request->is_customer);
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
            $user->password = Hash::make($tempPassword);
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
            ], 'Google login successful');

        } catch (\Exception $e) {
            Log::error('Google login failed: '.$e->getMessage(), [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse('Google login failed: '.$e->getMessage(), 500);
        }
    }

    /**
     * Login with Apple
     *
     * @group Authentication
     *
     * @subgroup Social Login
     *
     * Authenticate a user using Apple Sign In.
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
        try {
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
            $user->password = Hash::make($tempPassword);
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

        } catch (\Exception $e) {
            Log::error('Apple login failed: '.$e->getMessage(), [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse('Apple login failed: '.$e->getMessage(), 500);
        }
    }

    /**
     * Verify Google ID token
     */
    private function verifyGoogleToken(string $idToken): ?array
    {
        try {
            // For now, we'll decode without verification for development
            // In production, you should implement proper JWT verification
            $tks = explode('.', $idToken);

            if (count($tks) !== 3) {
                return null;
            }

            $payload = json_decode(JWT::urlsafeB64Decode($tks[1]), true);

            if (! $payload || ! isset($payload['sub']) || ! isset($payload['email'])) {
                return null;
            }

            // Basic validation
            if ($payload['iss'] !== 'https://accounts.google.com' && $payload['iss'] !== 'accounts.google.com') {
                return null;
            }

            return $payload;

        } catch (\Exception $e) {
            Log::error('Google token verification failed: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Verify Apple identity token
     */
    private function verifyAppleToken(string $identityToken): ?array
    {
        try {
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

        } catch (\Exception $e) {
            Log::error('Apple token verification failed: '.$e->getMessage());

            return null;
        }
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
            'password' => Hash::make(Str::random(32)), // Random password for social login
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
            'password' => Hash::make(Str::random(32)), // Random password for social login
        ];

        $user = User::create($userData);

        return $user;
    }

    /**
     * Check if user exists based on social login token
     *
     * @group Authentication
     *
     * @subgroup Social Login
     *
     * Check if a user exists based on their social login token (Google/Apple).
     *
     * @bodyParam token string required Social login token (Google ID token or Apple identity token). Example: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
     * @bodyParam provider string required Social provider. Example: google
     * @bodyParam grant_type string optional OAuth grant type. Example: password
     * @bodyParam client_id string required OAuth client ID. Example: 1
     * @bodyParam client_secret string required OAuth client secret. Example: your-client-secret
     *
     * @response 200 scenario="user found" {
     *   "success": true,
     *   "message": "User found",
     *   "data": {
     *     "user": {
     *       "id": 1,
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
        try {
            $token = $request->token;
            $provider = $request->provider;

            // Verify token and extract user data
            if ($provider === 'google') {
                $tokenData = $this->verifyGoogleToken($token);
                if (! $tokenData) {
                    return $this->errorResponse('Invalid Google token', 400);
                }

                // Find user by Google ID or email
                $user = User::findByGoogleId($tokenData['sub'])
                    ?? User::findByEmailForSocial($tokenData['email']);

            } elseif ($provider === 'apple') {
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
                $user->password = Hash::make($tempPassword);
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

        } catch (\Exception $e) {
            Log::error('Check user error: '.$e->getMessage());

            return $this->errorResponse('An error occurred while checking user', 500);
        }
    }
}
