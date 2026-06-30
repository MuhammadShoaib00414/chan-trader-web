<?php

namespace App\Http\Controllers\Admin;

use App\Enums\FcmPlatform;
use App\Http\Controllers\AppBaseController;
use App\Services\Notifications\FcmTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Session-authenticated FCM token registration for the admin web dashboard.
 */
class FcmTokenController extends AppBaseController
{
    public function __construct(
        private FcmTokenService $fcmTokens,
    ) {}

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fcm_token' => ['required', 'string'],
            'platform' => ['nullable', 'string', Rule::in(FcmPlatform::values())],
            'device_id' => ['nullable', 'string', 'max:191'],
        ]);

        $platform = FcmPlatform::tryFrom($validated['platform'] ?? FcmPlatform::Web->value)
            ?? FcmPlatform::Web;

        $deviceId = $validated['device_id'] ?? $request->session()->getId();

        $this->fcmTokens->register(
            $request->user(),
            $validated['fcm_token'],
            $platform,
            $deviceId,
        );

        return $this->successResponse(null, 'FCM token registered successfully');
    }

    public function destroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fcm_token' => ['nullable', 'string'],
        ]);

        $this->fcmTokens->remove(
            $request->user(),
            $validated['fcm_token'] ?? null,
            FcmPlatform::Web,
        );

        return $this->successResponse(null, 'FCM token removed successfully');
    }
}
