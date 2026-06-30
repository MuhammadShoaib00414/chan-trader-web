<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\AppBaseController;
use App\Services\VendorStoreProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorStoreProfileController extends AppBaseController
{
    public function __construct(
        private VendorStoreProfileService $storeProfile,
    ) {}

    /**
     * Get the authenticated vendor's primary store.
     *
     * @group Auth
     *
     * @authenticated
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user('api');
        abort_unless($user->hasRole('vendor'), 403, 'Only vendors can access store profile.');

        $store = $this->storeProfile->resolveOwnedStore($user->id);
        if (! $store) {
            return $this->errorResponse('No store found for this vendor.', 404);
        }

        return $this->successResponse([
            'id' => $store->id,
            'name' => $store->name,
            'slug' => $store->slug,
            'logo' => $store->logo,
            'banner' => $store->banner,
            'city' => $store->city,
            'address' => $store->address,
        ], 'Store profile retrieved');
    }

    /**
     * Update store logo and/or banner for the authenticated vendor.
     *
     * @group Auth
     *
     * @bodyParam logo file optional Store logo image (jpeg, png, jpg, gif, webp; max 5MB).
     * @bodyParam banner file optional Store banner image (jpeg, png, jpg, gif, webp; max 5MB).
     *
     * @authenticated
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user('api');
        abort_unless($user->hasRole('vendor'), 403, 'Only vendors can update store profile.');

        $store = $this->storeProfile->resolveOwnedStore($user->id);
        if (! $store) {
            return $this->errorResponse('No store found for this vendor.', 404);
        }

        $request->validate([
            'logo' => ['sometimes', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
            'banner' => ['sometimes', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
            'remove_logo' => ['sometimes', 'boolean'],
            'remove_banner' => ['sometimes', 'boolean'],
        ]);

        if (
            ! $request->hasFile('logo')
            && ! $request->hasFile('banner')
            && ! $request->boolean('remove_logo')
            && ! $request->boolean('remove_banner')
        ) {
            return $this->errorResponse('Provide logo, banner, or a remove flag to update store images.');
        }

        $data = $this->storeProfile->syncImages($request, $store);

        return $this->successResponse($data, 'Store profile updated successfully');
    }
}
