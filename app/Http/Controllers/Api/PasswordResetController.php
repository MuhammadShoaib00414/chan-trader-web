<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\AppBaseController;
use App\Http\Requests\Api\ResetPasswordRequest;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class PasswordResetController extends AppBaseController
{
    /**
     * Reset Password
     *
     * @group Authentication
     *
     * @subgroup Password Management
     *
     * Reset user password using the reset token from OTP verification.
     *
     * @bodyParam email string required User's email address. Example: john@example.com
     * @bodyParam reset_token string required Reset token from OTP verification. Example: abc123def456
     * @bodyParam password string required New password (min 8 characters). Example: newpassword123
     * @bodyParam password_confirmation string required Password confirmation. Example: newpassword123
     *
     * @response 200 scenario="success" {
     *   "success": true,
     *   "message": "Password has been reset successfully",
     *   "data": null
     * }
     * @response 404 scenario="user not found" {
     *   "success": false,
     *   "message": "User not found",
     *   "data": null
     * }
     * @response 400 scenario="invalid token" {
     *   "success": false,
     *   "message": "Invalid reset token. Please request a new password reset.",
     *   "data": null
     * }
     *
     * @unauthenticated
     */
    public function resetPassword(ResetPasswordRequest $request)
    {
        try {
            $user = User::where('email', $request->email)->first();

            // Check if user exists
            if (! $user) {
                return $this->errorResponse('User not found', 404);
            }

            // Check if reset token exists
            if (! $user->remember_token) {
                return $this->errorResponse('No reset token found. Please request a password reset first.', 400);
            }

            // Verify reset token
            if (! Hash::check($request->reset_token, $user->remember_token)) {
                return $this->errorResponse('Invalid reset token. Please request a new password reset.', 400);
            }

            // Update password
            $user->update([
                'password' => Hash::make($request->password),
                'remember_token' => null,
            ]);

            // Revoke all tokens for this user
            $user->tokens()->delete();

            return $this->successResponse(null, 'Password has been reset successfully');

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to reset password: '.$e->getMessage(), 500);
        }
    }
}
