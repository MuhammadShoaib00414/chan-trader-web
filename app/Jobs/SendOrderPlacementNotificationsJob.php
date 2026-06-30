<?php

namespace App\Jobs;

use App\Enums\FcmPlatform;
use App\Enums\NotificationAction;
use App\Models\Order;
use App\Models\User;
use App\Services\Notifications\AppNotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendOrderPlacementNotificationsJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $orderId,
        public int $customerUserId,
    ) {}

    public function handle(AppNotificationService $notifications): void
    {
        $order = Order::query()
            ->with(['items.product', 'shippingAddress', 'user'])
            ->find($this->orderId);

        $customer = User::query()->find($this->customerUserId);

        if (! $order || ! $customer) {
            return;
        }

        $orderPayload = [
            'order_id' => $order->id,
            'order_code' => $order->code,
            'grand_total' => (string) $order->grand_total,
            'currency' => $order->currency,
            'message' => "Your order {$order->code} has been placed successfully.",
        ];

        $notifications->notify(
            $customer,
            NotificationAction::OrderPlaced,
            $orderPayload,
            sendEmail: true,
            sendPush: true,
            pushPlatforms: [FcmPlatform::Mobile],
        );

        $notifications->notifyAdmins(NotificationAction::AdminNewOrder, [
            'order_id' => $order->id,
            'order_code' => $order->code,
            'customer_name' => $customer->name,
            'grand_total' => (string) $order->grand_total,
            'currency' => $order->currency,
            'placed_at' => $order->created_at?->toDayDateTimeString(),
            'message' => "New order {$order->code} placed by {$customer->name}.",
        ]);

        $notifications->notifyVendorsForOrder($order, [
            'order_code' => $order->code,
        ]);
    }
}
