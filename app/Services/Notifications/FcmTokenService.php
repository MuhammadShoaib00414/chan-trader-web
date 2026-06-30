<?php

namespace App\Services\Notifications;

use App\Enums\FcmPlatform;
use App\Models\User;
use App\Models\UserFcmToken;
use Illuminate\Support\Facades\Log;

class FcmTokenService
{
    /**
     * Register or refresh an FCM token for a user device.
     */
    public function register(
        User $user,
        string $token,
        FcmPlatform $platform,
        ?string $deviceId = null,
    ): UserFcmToken {
        $record = UserFcmToken::query()->updateOrCreate(
            ['token' => $token],
            [
                'user_id' => $user->id,
                'platform' => $platform,
                'device_id' => $deviceId,
                'last_used_at' => now(),
            ],
        );

        // Keep legacy column in sync for older clients (latest mobile token).
        if ($platform === FcmPlatform::Mobile) {
            $user->update(['fcm_token' => $token]);
        }

        return $record;
    }

    /**
     * Remove a specific token (logout / unsubscribe).
     */
    public function remove(User $user, ?string $token = null, ?FcmPlatform $platform = null): void
    {
        $query = UserFcmToken::query()->where('user_id', $user->id);

        if ($token) {
            $query->where('token', $token);
        }

        if ($platform) {
            $query->where('platform', $platform);
        }

        $query->delete();

        if (! $token && ! $platform) {
            $user->update(['fcm_token' => null]);

            return;
        }

        if ($platform === FcmPlatform::Mobile || ($token && $user->fcm_token === $token)) {
            $latestMobile = UserFcmToken::query()
                ->where('user_id', $user->id)
                ->where('platform', FcmPlatform::Mobile)
                ->latest('last_used_at')
                ->value('token');

            $user->update(['fcm_token' => $latestMobile]);
        }
    }

    /**
     * Remove tokens FCM rejected as invalid/unregistered.
     */
    public function pruneInvalidToken(string $token): void
    {
        $deleted = UserFcmToken::query()->where('token', $token)->delete();

        if ($deleted > 0) {
            Log::info('Pruned invalid FCM token', ['token_prefix' => substr($token, 0, 12)]);
        }

        User::query()->where('fcm_token', $token)->update(['fcm_token' => null]);
    }
}
