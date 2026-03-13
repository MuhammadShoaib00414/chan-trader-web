<?php

namespace App\Http\Controllers\Api\Auth;

use App\Enums\OtpType;
use App\Http\Controllers\AppBaseController;
use App\Http\Requests\Api\SendOtpRequest;
use App\Http\Requests\Api\VerifyEmailRequest;
use App\Http\Requests\Api\VerifyPasswordResetOtpRequest;
use App\Http\Resources\UserResource;
use App\Mail\WelcomeEmail;
use App\Models\User;
use App\Traits\IssueTokenTrait;
use App\Traits\OtpTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class OtpController extends AppBaseController
{
    use IssueTokenTrait, OtpTrait;

    /**
     * Send OTP for various verification purposes
     *
     * @return \Illuminate\Http\JsonResponse
     */
    private function sendOTP(Request $request, OtpType $type)
    {
        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return $this->errorResponse('User not found', 404);
        }

        $isVerified = ! is_null($user->email_verified_at);

        // If updated email verification is required and old email is already verified, send new OTP
        if ($type === OtpType::EMAIL_VERIFICATION && $isVerified && $user->pending_email) {
            $otp = $this->generateAndSaveOTP($user, OtpType::EMAIL_VERIFICATION->value, $user->pending_email);

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

            return $this->successResponse([
                'email' => $user->email,
                'requires_email_verification' => true,
                'otp' => $otp,
            ], 'Please verify your email first. A new verification code has been sent to your email.', 200);
        }

        // Proceed with the original OTP request
        $otp = $this->generateAndSaveOTP($user, $type->value);

        return $this->successResponse([
            'email' => $user->email,
            'otp' => $otp,
        ], $type->getMessage());
    }

    /**
     * Send email verification OTP
     *
     * @group OTP
     *
     * @bodyParam email string required User's email address. Example: john@example.com
     *
     * @response 200 scenario="success" {
     *   "success": true,
     *   "message": "Verification code has been sent to your email",
     *   "data": {
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
     * Send password reset OTP
     *
     * @group OTP
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
     * Verify email with OTP
     *
     * @group OTP
     *
     * @bodyParam email string required User's email address. Example: john@example.com
     * @bodyParam otp string required 4-digit OTP code. Example: 1234
     *
     * @response 200 scenario="success" {
     *   "success": true,
     *   "message": "Account verified successfully",
     *   "data": null
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

        // log incoming OTP attempt
        Log::info('Email verification OTP attempt', [
            'email' => $request->email,
            'otp' => $request->otp,
            'pending_verification' => $isVerifyingPendingEmail,
        ]);

        [$isValid, $error] = $this->verifyUserOTP($user, $request->otp);

        if (! $isValid) {
            Log::warning('Email verification failed', ['email' => $request->email, 'reason' => $error]);

            return $this->errorResponse($error, 400);
        }

        Log::info('Email verification succeeded', ['email' => $request->email]);

        // If verifying pending email, update the main email
        if ($isVerifyingPendingEmail) {
            $user->email = $user->pending_email;
            $user->pending_email = null;
            $user->email_verified_at = now();
        } else {
            // Mark email as verified for new registration
            $user->email_verified_at = now();

            // Send welcome email
            Mail::to($user->email)->send(new WelcomeEmail($user));
        }

        // Approve/activate the account
        $user->status = User::STATUS_ACTIVE;
        $user->otp = null;
        $user->otp_expires_at = null;
        $user->save();

        return $this->successResponse(
            null,
            'Account verified successfully'
        );
    }

    /**
     * Verify password reset OTP
     *
     * @group OTP
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
     *       "full_name": "John Doe",
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
        $user = User::where('email', $request->email)->first();

        if (! $user->email_verified_at) {
            return $this->errorResponse('Please verify your email first', 400);
        }

        // log attempt
        Log::info('Password reset OTP attempt', [
            'email' => $request->email,
            'otp' => $request->otp,
        ]);

        [$isValid, $error] = $this->verifyUserOTP($user, $request->otp);

        if (! $isValid) {
            Log::warning('Password reset OTP failed', ['email' => $request->email, 'reason' => $error]);

            return $this->errorResponse($error, 400);
        }

        Log::info('Password reset OTP succeeded', ['email' => $request->email]);

        // Generate reset token
        $reset_token = Str::random(60);

        // Store reset token in password_reset_tokens table
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'email' => $user->email,
                'token' => Hash::make($reset_token),
                'created_at' => now(),
            ]
        );

        $user->update([
            'otp' => null,
            'otp_expires_at' => null,
        ]);

        return $this->successResponse([
            'user' => new UserResource($user),
            'reset_token' => $reset_token,
        ], 'OTP verified successfully');
    }
}
