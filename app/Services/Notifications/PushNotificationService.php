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
        [$accessToken, $projectId] = $this->resolveAuth();
        if (! $accessToken || ! $projectId) {
            return false;
        }

        $body = (string) ($payload['body'] ?? $payload['message'] ?? $action->label());
        $data = collect($payload)
            ->except(['body', 'message'])
            ->map(fn ($value) => is_scalar($value) ? (string) $value : json_encode($value))
            ->all();

        // Deep-link target used by web (desktop/browser) notifications on click.
        // For order notifications the admin dashboard order details page is opened.
        $link = $payload['link'] ?? (! empty($payload['order_id'])
            ? url('/admin/orders/' . $payload['order_id'])
            : null);

        if ($link) {
            $data['link'] = (string) $link;
        }

        $message = [
            'token' => $token,
            'notification' => [
                'title' => $action->pushTitle(),
                'body' => $body,
            ],
            'data' => array_merge(['action' => $action->value], $data),
        ];

        if ($link) {
            // FCM HTTP v1 webpush config: opens this URL when the notification is clicked.
            $message['webpush'] = [
                'fcm_options' => ['link' => (string) $link],
            ];
        }

        $response = Http::withToken($accessToken)
            ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", [
                'message' => $message,
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

    /**
     * Send a raw push notification to any FCM token with a custom title and body.
     *
     * @param  array<string, string>  $data
     */
    public function sendRaw(string $token, string $title, string $body, array $data = []): bool
    {
        [$accessToken, $projectId] = $this->resolveAuth();
        if (! $accessToken || ! $projectId) {
            return false;
        }

        $message = [
            'token'        => $token,
            'notification' => compact('title', 'body'),
        ];
        if ($data) {
            $message['data'] = $data;
        }

        $response = Http::withToken($accessToken)
            ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", [
                'message' => $message,
            ]);

        if (! $response->successful()) {
            Log::warning('FCM raw push failed', [
                'status' => $response->status(),
                'body'   => $response->json(),
            ]);

            return false;
        }

        return true;
    }

    /**
     * Returns [accessToken, projectId] from the credentials file.
     * Using project_id from the credentials file avoids FCM_PROJECT_ID mismatches.
     *
     * @return array{0: string|null, 1: string|null}
     */
    private function resolveAuth(): array
    {
        $path = config('fcm.credentials_path');
        if (! $path || ! is_readable($path)) {
            return [null, null];
        }

        $credentials = json_decode((string) file_get_contents($path), true);
        if (! is_array($credentials) || empty($credentials['client_email']) || empty($credentials['private_key'])) {
            return [null, null];
        }

        // Prefer project_id from credentials file; fall back to config so existing deployments
        // that set FCM_PROJECT_ID explicitly still work.
        $projectId = $credentials['project_id'] ?? config('fcm.project_id');
        if (! $projectId) {
            return [null, null];
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
            Log::warning('FCM OAuth token exchange failed', [
                'status' => $tokenResponse->status(),
                'body'   => $tokenResponse->json(),
            ]);

            return [null, null];
        }

        return [$tokenResponse->json('access_token'), $projectId];
    }
}
