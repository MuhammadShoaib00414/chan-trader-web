<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\AppBaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Session-authenticated FCM token registration for the admin web dashboard.
 * Mirrors Api\Auth\FcmTokenController (Passport) but for the web guard.
 */
class FcmTokenController extends AppBaseController
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fcm_token' => ['required', 'string'],
        ]);

        $request->user()->update(['fcm_token' => $validated['fcm_token']]);

        return $this->successResponse(null, 'FCM token registered successfully');
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->user()->update(['fcm_token' => null]);

        return $this->successResponse(null, 'FCM token removed successfully');
    }
}
