<?php

namespace App\Services\Notifications;

use App\Enums\NotificationAction;
use App\Models\AppNotification;
use App\Models\Order;
use App\Models\Store;
use App\Models\User;

class AppNotificationService
{
    public function __construct(
        private EmailNotificationService $email,
        private PushNotificationService $push,
    ) {}

    /**
     * Notify a single user (email + push + DB persistence).
     *
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
        $emailResult = $sendEmail ? $this->email->send($user, $action, $payload) : false;
        $pushResult = $sendPush ? $this->push->send($user, $action, $payload) : false;

        if ($action->shouldPersist()) {
            AppNotification::create([
                'user_id' => $user->id,
                'type' => $action->value,
                'title' => $action->pushTitle(),
                'body' => $action->notificationBody($payload),
                'data' => collect($payload)->filter(fn ($v) => is_scalar($v))->all(),
            ]);
        }

        return ['email' => $emailResult, 'push' => $pushResult];
    }

    /**
     * Notify by user ID.
     *
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

    /**
     * Notify all super-admin and admin users (push + DB; email only when the action
     * supports it, e.g. AdminNewOrder).
     *
     * @param  array<string, mixed>  $payload
     */
    public function notifyAdmins(
        NotificationAction $action,
        array $payload = [],
        bool $sendPush = true,
    ): void {
        $sendEmail = $action->supportsEmail();

        User::role(['super-admin', 'admin'])->get()->each(
            fn (User $admin) => $this->notify($admin, $action, $payload, $sendEmail, $sendPush)
        );
    }

    /**
     * Notify the store owners (vendors) whose products appear in the given order.
     *
     * @param  array<string, mixed>  $payload
     */
    public function notifyVendorsForOrder(Order $order, array $payload = []): void
    {
        $storeIds = $order->items()->pluck('store_id')->filter()->unique();

        if ($storeIds->isEmpty()) {
            return;
        }

        $vendorIds = Store::whereIn('id', $storeIds)->pluck('owner_id')->filter()->unique();

        if ($vendorIds->isEmpty()) {
            return;
        }

        User::whereIn('id', $vendorIds)->get()->each(
            fn (User $vendor) => $this->notify($vendor, NotificationAction::VendorNewOrder, $payload, false, true)
        );
    }
}
