<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\AppBaseController;
use App\Http\Requests\Api\ResetPasswordRequest;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class PasswordController extends AppBaseController
{
    /**
     * Change user password
     *
     * @group Password
     *
     * @bodyParam current_password string required Current password. Example: oldpassword123
     * @bodyParam new_password string required New password (min 8 characters). Example: newpassword123
     * @bodyParam new_password_confirmation string required New password confirmation. Example: newpassword123
     *
     * @response 200 scenario="success" {
     *   "success": true,
     *   "message": "Password changed successfully. Please log in again.",
     *   "data": null
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
        $user = $request->user('api');

        // Update the user's password
        $user->update([
            'password' => $request->new_password, // Password is automatically hashed by model casting
        ]);

        // Revoke all existing tokens for security
        $user->tokens()->delete();

        return $this->successResponse(null, 'Password changed successfully. Please log in again.');
    }

    /**
     * Reset user password using reset token
     *
     * @group Password
     *
     * @bodyParam email string required User's email address. Example: john@example.com
     * @bodyParam reset_token string required Reset token from OTP verification. Example: abc123def456ghi789
     * @bodyParam password string required New password (min 8 characters). Example: newpassword123
     * @bodyParam password_confirmation string required New password confirmation. Example: newpassword123
     *
     * @response 200 scenario="success" {
     *   "success": true,
     *   "message": "Password reset successfully. Please log in with your new password.",
     *   "data": {
     *     "user": {
     *       "id": 1,
     *       "full_name": "John Doe",
     *       "first_name": "John",
     *       "last_name": "Doe",
     *       "email": "john@example.com"
     *     },
     *   }
     * }
     * @response 400 scenario="invalid token" {
     *   "success": false,
     *   "message": "Invalid or expired reset token",
     *   "data": null
     * }
     * @response 404 scenario="user not found" {
     *   "success": false,
     *   "message": "User not found",
     *   "data": null
     * }
     *
     * @unauthenticated
     */
    public function resetPassword(ResetPasswordRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return $this->errorResponse('User not found', 404);
        }

        // Verify reset token from password_reset_tokens table
        $passwordReset = DB::table('password_reset_tokens')
            ->where('email', $user->email)
            ->first();

        if (! $passwordReset || ! Hash::check($request->reset_token, $passwordReset->token)) {
            return $this->errorResponse('Invalid or expired reset token', 400);
        }

        // Update password
        $user->update([
            'password' => $request->password, // Password is automatically hashed by model casting
        ]);

        // Clear reset token from password_reset_tokens table
        DB::table('password_reset_tokens')
            ->where('email', $user->email)
            ->delete();

        // Revoke all existing tokens for security
        $user->tokens()->delete();

        return $this->successResponse([
            'user' => new UserResource($user),
        ], 'Password reset successfully. Please log in with your new password.');
    }
}
