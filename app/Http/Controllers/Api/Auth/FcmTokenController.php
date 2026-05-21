<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\AppBaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FcmTokenController extends AppBaseController
{
    /**
     * Register or update FCM token
     *
     * @group Auth
     *
     * Register or update the Firebase Cloud Messaging token for push notifications.
     *
     * @bodyParam fcm_token string required The FCM token from the mobile app. Example: dGhpc2lzYWZha2V0b2tlbg
     *
     * @authenticated
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fcm_token' => ['required', 'string'],
        ]);

        $user = $request->user();
        $user->update(['fcm_token' => $validated['fcm_token']]);

        return $this->successResponse(null, 'FCM token registered successfully');
    }

    /**
     * Remove FCM token
     *
     * @group Auth
     *
     * Remove the Firebase Cloud Messaging token (logout/unsubscribe from notifications).
     *
     * @authenticated
     */
    public function destroy(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->update(['fcm_token' => null]);

        return $this->successResponse(null, 'FCM token removed successfully');
    }
}
