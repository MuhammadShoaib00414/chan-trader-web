<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\AppBaseController;
use App\Http\Requests\Api\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;

class ProfileController extends AppBaseController
{
    /**
     * Update the authenticated user's profile (first name, last name, email, phone only).
     *
     * @group Auth
     *
     * @bodyParam first_name string optional User's first name. Example: John
     * @bodyParam last_name string optional User's last name. Example: Doe
     * @bodyParam email string optional User's email address. Example: john@example.com
     * @bodyParam phone_number string optional Pakistani mobile format. Example: 03001234567
     *
     * @authenticated
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user('api');
        $validated = $request->validated();

        if (array_key_exists('first_name', $validated)) {
            $user->first_name = $validated['first_name'];
        }
        if (array_key_exists('last_name', $validated)) {
            $user->last_name = $validated['last_name'];
        }
        if (array_key_exists('phone_number', $validated)) {
            $user->phone_number = $validated['phone_number'];
        }
        if (array_key_exists('email', $validated) && $validated['email'] !== $user->email) {
            $user->email = $validated['email'];
            // $user->email_verified_at = null;
            // $user->pending_email = null;
        }

        $user->save();

        return $this->successResponse([
            'user' => new UserResource($user->fresh()->load('roles.permissions')),
        ], 'Profile updated successfully');
    }
}
