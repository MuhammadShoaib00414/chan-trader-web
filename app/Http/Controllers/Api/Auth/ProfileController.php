<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\AppBaseController;
use App\Http\Requests\Api\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;

class ProfileController extends AppBaseController
{
    /**
     * Update the authenticated user's profile (first name, last name, email, phone, avatar, cover image).
     *
     * @group Auth
     *
     * @bodyParam first_name string optional User's first name. Example: John
     * @bodyParam last_name string optional User's last name. Example: Doe
     * @bodyParam email string optional User's email address. Example: john@example.com
     * @bodyParam phone_number string optional Pakistani mobile format. Example: 03001234567
     * @bodyParam avatar file optional User's profile picture (jpeg, png, jpg, gif, max 2MB).
     * @bodyParam cover_image file optional User's profile cover/banner image (jpeg, png, jpg, gif, max 5MB).
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
        if (array_key_exists('shop_name', $validated)) {
            $user->shop_name = $validated['shop_name'];
        }
        if (array_key_exists('city_district', $validated)) {
            $user->city_district = $validated['city_district'];
        }
        if (array_key_exists('address', $validated)) {
            $user->address = $validated['address'];
        }
        if (array_key_exists('email', $validated) && $validated['email'] !== $user->email) {
            $user->email = $validated['email'];
            // $user->email_verified_at = null;
            // $user->pending_email = null;
        }

        // Handle avatar upload
        if ($request->hasFile('avatar')) {
            $this->handleImageUpload($request, $user, 'avatar', 2048); // 2MB limit
        }

        // Handle cover image upload
        if ($request->hasFile('cover_image')) {
            $this->handleImageUpload($request, $user, 'cover_image', 5120); // 5MB limit
        }

        $user->save();

        if ($user->hasRole('vendor')) {
            $store = \App\Models\Store::query()
                ->where('owner_id', $user->id)
                ->orderBy('id')
                ->first();

            if ($store) {
                $storeData = [];
                if (array_key_exists('shop_name', $validated) && filled($validated['shop_name'])) {
                    $storeData['name'] = $validated['shop_name'];
                }
                if (array_key_exists('city_district', $validated)) {
                    $storeData['city'] = $validated['city_district'];
                }
                if (array_key_exists('address', $validated)) {
                    $storeData['address'] = $validated['address'];
                }
                if (array_key_exists('phone_number', $validated)) {
                    $storeData['phone'] = $validated['phone_number'];
                }
                if ($storeData !== []) {
                    $store->update($storeData);
                }
            }
        }

        return $this->successResponse([
            'user' => new UserResource($user->fresh()->load('roles.permissions')),
        ], 'Profile updated successfully');
    }

    /**
     * Handle image file upload for profile images.
     *
     * @param UpdateProfileRequest $request
     * @param $user
     * @param string $fieldName Field name (avatar or cover_image)
     * @param int $maxSizeKb Maximum file size in KB
     * @return void
     */
    private function handleImageUpload(UpdateProfileRequest $request, $user, string $fieldName, int $maxSizeKb): void
    {
        $image = $request->file($fieldName);

        // Validate file type and size
        if (!$image->isValid() || !in_array($image->getMimeType(), ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'])) {
            return; // Validation handled by request
        }

        if ($image->getSize() > $maxSizeKb * 1024) {
            return; // Validation handled by request
        }

        // Generate unique filename
        $directory = $fieldName === 'avatar' ? 'avatars' : 'covers';
        $filename = $fieldName . '_' . $user->id . '_' . time() . '.' . $image->getClientOriginalExtension();

        // Store the file
        $path = $image->storeAs($directory, $filename, 'public');

        // Delete old file if exists
        $oldPath = $user->{$fieldName};
        if ($oldPath && \Storage::disk('public')->exists($oldPath)) {
            \Storage::disk('public')->delete($oldPath);
        }

        $user->{$fieldName} = $path;
    }
}
