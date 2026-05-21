<?php

namespace App\Services\Notifications;

use App\Enums\NotificationAction;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function send(User $user, NotificationAction $action, array $payload = []): bool
    {
        if (! $action->supportsPush()) {
            return false;
        }

        $settings = Setting::getGroup('notifications');
        if (! ($settings['push_notifications_enabled'] ?? true)) {
            return false;
        }

        if (! $user->fcm_token) {
            return false;
        }

        if (! config('fcm.enabled')) {
            Log::info('FCM push skipped (not enabled)', [
                'user_id' => $user->id,
                'action' => $action->value,
            ]);

            return false;
        }

        return $this->sendToToken($user->fcm_token, $action, $payload);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function sendToToken(string $token, NotificationAction $action, array $payload = []): bool
    {
        $accessToken = $this->resolveAccessToken();
        if (! $accessToken) {
            return false;
        }

        $projectId = config('fcm.project_id');
        if (! $projectId) {
            return false;
        }

        $body = (string) ($payload['body'] ?? $payload['message'] ?? $action->label());
        $data = collect($payload)
            ->except(['body', 'message'])
            ->map(fn ($value) => is_scalar($value) ? (string) $value : json_encode($value))
            ->all();

        $response = Http::withToken($accessToken)
            ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", [
                'message' => [
                    'token' => $token,
                    'notification' => [
                        'title' => $action->pushTitle(),
                        'body' => $body,
                    ],
                    'data' => array_merge(['action' => $action->value], $data),
                ],
            ]);

        if (! $response->successful()) {
            Log::warning('FCM push failed', [
                'status' => $response->status(),
                'body' => $response->json(),
            ]);

            return false;
        }

        return true;
    }

    private function resolveAccessToken(): ?string
    {
        $path = config('fcm.credentials_path');
        if (! $path || ! is_readable($path)) {
            return null;
        }

        $credentials = json_decode((string) file_get_contents($path), true);
        if (! is_array($credentials) || empty($credentials['client_email']) || empty($credentials['private_key'])) {
            return null;
        }

        $now = time();
        $header = rtrim(strtr(base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT'])), '+/', '-_'), '=');
        $claim = rtrim(strtr(base64_encode(json_encode([
            'iss' => $credentials['client_email'],
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud' => 'https://oauth2.googleapis.com/token',
            'iat' => $now,
            'exp' => $now + 3600,
        ])), '+/', '-_'), '=');

        $unsigned = "{$header}.{$claim}";
        openssl_sign($unsigned, $signature, $credentials['private_key'], OPENSSL_ALGO_SHA256);
        $jwt = $unsigned.'.'.rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');

        $tokenResponse = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        ]);

        if (! $tokenResponse->successful()) {
            return null;
        }

        return $tokenResponse->json('access_token');
    }
}
