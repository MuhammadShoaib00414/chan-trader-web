<?php

namespace App\Services\Notifications;

use App\Enums\NotificationAction;
use App\Models\User;

class AppNotificationService
{
    public function __construct(
        private EmailNotificationService $email,
        private PushNotificationService $push,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     * @return array{email: bool, push: bool}
     */
    public function notify(
        User $user,
        NotificationAction $action,
        array $payload = [],
        bool $sendEmail = true,
        bool $sendPush = true,
    ): array {
        return [
            'email' => $sendEmail ? $this->email->send($user, $action, $payload) : false,
            'push' => $sendPush ? $this->push->send($user, $action, $payload) : false,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{email: bool, push: bool}
     */
    public function notifyById(
        int $userId,
        NotificationAction $action,
        array $payload = [],
        bool $sendEmail = true,
        bool $sendPush = true,
    ): array {
        $user = User::query()->findOrFail($userId);

        return $this->notify($user, $action, $payload, $sendEmail, $sendPush);
    }
}
