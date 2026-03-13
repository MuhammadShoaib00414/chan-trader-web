<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\AppBaseController;
use App\Http\Requests\Api\RegisterRequest;
use App\Models\User;
use App\Traits\OtpTrait;
use Illuminate\Support\Facades\DB;

class RegisterController extends AppBaseController
{
    use OtpTrait;

    /**
     * Register user (assigns the `user` role by default)
     *
     * @group Auth
     *
     * @bodyParam full_name string required User's full name. Example: John Doe
     * @bodyParam email string required User's email address. Example: john@example.com
     * @bodyParam phone_number string required User's phone number in Pakistan format. Example: 03001234567
     * @bodyParam password string required User's password (min 8 characters). Example: password123
     * @bodyParam password_confirmation string required Password confirmation. Example: password123
     * @bodyParam shop_name string required Name of the user's shop or business. Example: "Ali Store"
     * @bodyParam city_district string required City or district of the user. Example: Lahore
     * @bodyParam address string required Complete address of the user. Example: "123 Main Street, Lahore"
     * @bodyParam avatar file optional User's profile picture. Must be an image file (jpeg, png, jpg, gif) and max 1MB.
     *
     * @response 200 scenario="success" {
     *   "success": true,
     *   "message": "OTP has been sent. Please check your email to verify your account.",
     *   "data": null
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
        DB::transaction(function () use ($request) {
            // split full name into first/last (leave last blank if only one word)
            $nameParts = preg_split('/\s+/', trim($request->full_name), 2);
            $userData = [
                'first_name' => $nameParts[0] ?? '',
                'last_name' => $nameParts[1] ?? '',
                'email' => $request->email,
                'password' => $request->password, // Password is automatically hashed by model casting
                'status' => User::STATUS_INACTIVE,
                'phone_number' => $request->phone_number,
                'shop_name' => $request->shop_name,
                'city_district' => $request->city_district,
                'address' => $request->address,
            ];

            // Handle avatar upload if provided
            if ($request->hasFile('avatar')) {
                $userData['avatar'] = $request->file('avatar')->store('avatars', 'public');
            }

            $user = User::create($userData);

            // assign a default role
            $user->assignRole('user');

            // Generate and save OTP
            $this->generateAndSaveOTP($user, 'verification');
        });

        return $this->successResponse(
            null,
            'OTP has been sent. Please check your email to verify your account.'
        );
    }
}
