<?php

namespace App\Services\Notifications;

use App\Enums\FcmPlatform;
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
     * @param  list<FcmPlatform>|null  $pushPlatforms
     * @return array{email: bool, push: bool}
     */
    public function notify(
        User $user,
        NotificationAction $action,
        array $payload = [],
        bool $sendEmail = true,
        bool $sendPush = true,
        ?array $pushPlatforms = null,
    ): array {
        $emailResult = $sendEmail ? $this->email->send($user, $action, $payload) : false;
        $pushResult = $sendPush
            ? $this->push->send($user, $action, $payload, $pushPlatforms)
            : false;

        if ($action->shouldPersist()) {
            AppNotification::create([
                'user_id' => $user->id,
                'order_id' => $payload['order_id'] ?? null,
                'store_id' => $payload['store_id'] ?? null,
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
        ?array $pushPlatforms = null,
    ): array {
        $user = User::query()->findOrFail($userId);

        return $this->notify($user, $action, $payload, $sendEmail, $sendPush, $pushPlatforms);
    }

    /**
     * Notify all super-admin and admin users (web push + in-app + email).
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
            fn (User $admin) => $this->notify(
                $admin,
                $action,
                $payload,
                $sendEmail,
                $sendPush,
                [FcmPlatform::Web],
            )
        );
    }

    /**
     * Notify store owners (vendors) whose products appear in the given order.
     *
     * @param  array<string, mixed>  $payload
     */
    public function notifyVendorsForOrder(Order $order, array $payload = []): void
    {
        $order->loadMissing(['items', 'user']);

        $storeIds = $order->items->pluck('store_id')->filter()->unique();

        if ($storeIds->isEmpty()) {
            return;
        }

        $stores = Store::query()->whereIn('id', $storeIds)->get()->keyBy('id');

        $vendorIds = $stores->pluck('owner_id')->filter()->unique();

        if ($vendorIds->isEmpty()) {
            return;
        }

        User::query()->whereIn('id', $vendorIds)->get()->each(function (User $vendor) use ($order, $payload, $stores) {
            $vendorStoreIds = $stores->where('owner_id', $vendor->id)->pluck('id');
            $vendorItems = $order->items->whereIn('store_id', $vendorStoreIds);
            $vendorTotal = $vendorItems->sum('subtotal');
            $primaryStoreId = $vendorStoreIds->first();

            $vendorPayload = array_merge($payload, [
                'order_id' => $order->id,
                'order_code' => $order->code,
                'customer_name' => $order->user?->name ?? 'Customer',
                'grand_total' => (string) $vendorTotal,
                'currency' => $order->currency,
                'placed_at' => $order->created_at?->toDayDateTimeString(),
                'store_id' => $primaryStoreId,
                'message' => "New order {$order->code} received for your store.",
            ]);

            $this->notify(
                $vendor,
                NotificationAction::VendorNewOrder,
                $vendorPayload,
                sendEmail: true,
                sendPush: true,
                pushPlatforms: [FcmPlatform::Mobile],
            );
        });
    }
}
