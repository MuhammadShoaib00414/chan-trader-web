<?php

namespace App\Services\Notifications;

use App\Enums\FcmPlatform;
use App\Enums\NotificationAction;
use App\Models\Setting;
use App\Models\User;
use App\Models\UserFcmToken;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    public function __construct(
        private FcmTokenService $fcmTokens,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     * @param  list<FcmPlatform>|null  $platforms
     */
    public function send(
        User $user,
        NotificationAction $action,
        array $payload = [],
        ?array $platforms = null,
    ): bool {
        if (! $action->supportsPush()) {
            return false;
        }

        $settings = Setting::getGroup('notifications');
        if (! ($settings['push_notifications_enabled'] ?? true)) {
            return false;
        }

        if (! config('fcm.enabled')) {
            Log::info('FCM push skipped (not enabled)', [
                'user_id' => $user->id,
                'action' => $action->value,
            ]);

            return false;
        }

        $tokens = $this->resolveTokens($user, $platforms);

        if ($tokens->isEmpty()) {
            return false;
        }

        $sent = false;

        foreach ($tokens as $tokenRecord) {
            $platform = $tokenRecord->platform instanceof FcmPlatform
                ? $tokenRecord->platform
                : FcmPlatform::tryFrom((string) $tokenRecord->platform);

            if ($this->sendToToken($tokenRecord->token, $action, $payload, $platform)) {
                $tokenRecord->update(['last_used_at' => now()]);
                $sent = true;
            }
        }

        return $sent;
    }

    /**
     * @param  list<FcmPlatform>|null  $platforms
     * @return Collection<int, UserFcmToken>
     */
    private function resolveTokens(User $user, ?array $platforms): Collection
    {
        $query = UserFcmToken::query()->where('user_id', $user->id);

        if ($platforms !== null && $platforms !== []) {
            $values = array_map(
                fn (FcmPlatform $p) => $p->value,
                $platforms,
            );
            $scoped = (clone $query)->whereIn('platform', $values)->get();

            if ($scoped->isNotEmpty()) {
                return $scoped;
            }
        }

        $all = $query->get();

        if ($all->isNotEmpty()) {
            return $all;
        }

        // Legacy fallback: single token on users table (treated as mobile).
        if ($user->fcm_token) {
            return collect([
                new UserFcmToken([
                    'user_id' => $user->id,
                    'token' => $user->fcm_token,
                    'platform' => FcmPlatform::Mobile,
                ]),
            ]);
        }

        return collect();
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function sendToToken(
        string $token,
        NotificationAction $action,
        array $payload = [],
        ?FcmPlatform $platform = null,
    ): bool {
        [$accessToken, $projectId] = $this->resolveAuth();
        if (! $accessToken || ! $projectId) {
            return false;
        }

        $body = (string) ($payload['body'] ?? $payload['message'] ?? $action->label());
        $data = collect($payload)
            ->except(['body', 'message'])
            ->map(fn ($value) => is_scalar($value) ? (string) $value : json_encode($value))
            ->all();

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

        if ($link && ($platform === null || $platform === FcmPlatform::Web)) {
            $message['webpush'] = [
                'fcm_options' => ['link' => (string) $link],
            ];
        }

        if ($platform === FcmPlatform::Mobile) {
            $message['android'] = [
                'priority' => 'HIGH',
                'notification' => [
                    'channel_id' => 'high_importance_channel',
                    'sound' => 'default',
                ],
            ];
            $message['apns'] = [
                'payload' => [
                    'aps' => [
                        'sound' => 'default',
                    ],
                ],
            ];
        }

        $response = Http::withToken($accessToken)
            ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", [
                'message' => $message,
            ]);

        if (! $response->successful()) {
            $json = $response->json();

            Log::warning('FCM push failed', [
                'status' => $response->status(),
                'body' => $json,
            ]);

            if ($this->isInvalidTokenResponse($json)) {
                $this->fcmTokens->pruneInvalidToken($token);
            }

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
            'token' => $token,
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
            $json = $response->json();

            Log::warning('FCM raw push failed', [
                'status' => $response->status(),
                'body' => $json,
            ]);

            if ($this->isInvalidTokenResponse($json)) {
                $this->fcmTokens->pruneInvalidToken($token);
            }

            return false;
        }

        return true;
    }

    /**
     * @param  array<string, mixed>|null  $body
     */
    private function isInvalidTokenResponse(?array $body): bool
    {
        if (! is_array($body)) {
            return false;
        }

        $details = $body['error']['details'] ?? [];

        foreach ($details as $detail) {
            $code = $detail['errorCode'] ?? null;
            if (in_array($code, ['UNREGISTERED', 'INVALID_ARGUMENT'], true)) {
                return true;
            }
        }

        $message = strtolower((string) ($body['error']['message'] ?? ''));

        return str_contains($message, 'not found')
            || str_contains($message, 'unregistered')
            || str_contains($message, 'invalid registration');
    }

    /**
     * Returns [accessToken, projectId] from the credentials file.
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
                'body' => $tokenResponse->json(),
            ]);

            return [null, null];
        }

        return [$tokenResponse->json('access_token'), $projectId];
    }
}
