<?php

namespace App\Http\Controllers\Api\Auth;

use App\Enums\FcmPlatform;
use App\Http\Controllers\AppBaseController;
use App\Services\Notifications\FcmTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FcmTokenController extends AppBaseController
{
    public function __construct(
        private FcmTokenService $fcmTokens,
    ) {}

    /**
     * Register or update FCM token
     *
     * @group Auth
     *
     * Register or update the Firebase Cloud Messaging token for push notifications.
     *
     * @bodyParam fcm_token string required The FCM token from the mobile app. Example: dGhpc2lzYWZha2V0b2tlbg
     * @bodyParam platform string required Device platform: mobile or web. Example: mobile
     * @bodyParam device_id string optional Stable device identifier for multi-device support. Example: pixel-7-abc123
     *
     * @authenticated
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fcm_token' => ['required', 'string'],
            'platform' => ['nullable', 'string', Rule::in(FcmPlatform::values())],
            'device_id' => ['nullable', 'string', 'max:191'],
        ]);

        $platform = FcmPlatform::tryFrom($validated['platform'] ?? FcmPlatform::Mobile->value)
            ?? FcmPlatform::Mobile;

        $this->fcmTokens->register(
            $request->user(),
            $validated['fcm_token'],
            $platform,
            $validated['device_id'] ?? null,
        );

        return $this->successResponse(null, 'FCM token registered successfully');
    }

    /**
     * Remove FCM token
     *
     * @group Auth
     *
     * Remove the Firebase Cloud Messaging token (logout/unsubscribe from notifications).
     *
     * @bodyParam fcm_token string optional Specific token to remove. When omitted, all tokens for the user are removed.
     * @bodyParam platform string optional Limit removal to mobile or web tokens.
     *
     * @authenticated
     */
    public function destroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fcm_token' => ['nullable', 'string'],
            'platform' => ['nullable', 'string', Rule::in(FcmPlatform::values())],
        ]);

        $platform = isset($validated['platform'])
            ? FcmPlatform::tryFrom($validated['platform'])
            : null;

        $this->fcmTokens->remove(
            $request->user(),
            $validated['fcm_token'] ?? null,
            $platform,
        );

        return $this->successResponse(null, 'FCM token removed successfully');
    }
}
