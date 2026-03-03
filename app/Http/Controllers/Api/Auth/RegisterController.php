<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\AppBaseController;
use App\Http\Requests\Api\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Traits\OtpTrait;
use Illuminate\Http\Request;
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
     *   "message": "User registered successfully. Please check your email for OTP verification code.",
     *   "data": {
     *     "user": {
     *       "id": 1,
     *       "full_name": "John Doe",
     *       "first_name": "John",
     *       "last_name": "Doe",
     *       "email": "john@example.com",
     *       "phone_number": "03001234567",
     *       "shop_name": "Ali Store",
     *       "city_district": "Lahore",
     *       "address": "123 Main Street, Lahore",
     *       "avatar": "http://localhost/storage/avatars/example.jpg",
     *       "email_verified_at": null,
     *       "created_at": "2024-01-01T00:00:00.000000Z",
     *       "updated_at": "2024-01-01T00:00:00.000000Z"
     *     },
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
            // split full name into first/last (leave last blank if only one word)
            $nameParts = preg_split('/\s+/', trim($request->full_name), 2);
            $userData = [
                'first_name' => $nameParts[0] ?? '',
                'last_name' => $nameParts[1] ?? '',
                'email' => $request->email,
                'password' => $request->password, // Password is automatically hashed by model casting
                'status' => User::STATUS_ACTIVE,
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
            // ensure roles relation is loaded for response
            $user->load('roles');

            // Generate and save OTP
            $otp = $this->generateAndSaveOTP($user, 'verification');

            // only send otp; token creation happens after verification
            return [
                'user' => $user,
                'otp' => $otp,
            ];
        });

        return $this->successResponse([
            'user' => new UserResource($response['user']),
            'otp' => $response['otp'],
        ], 'User registered successfully. Please check your email for OTP verification code.');
    }
}
