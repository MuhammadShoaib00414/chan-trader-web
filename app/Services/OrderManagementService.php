<?php

namespace App\Services;

use App\Enums\NotificationAction;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Payment;
use App\Models\Shipment;
use App\Services\Notifications\AppNotificationService;

class OrderManagementService
{
    public const ORDER_STATUSES = [
        'pending',
        'confirmed',
        'packed',
        'shipped',
        'delivered',
        'cancelled',
        'refunded',
    ];

    public function updateOrderStatus(Order $order, string $toStatus, int $changedBy, ?string $comment = null, bool $notifyCustomer = false): Order
    {
        $from = (string) $order->status;
        $order->update(['status' => $toStatus]);

        OrderStatusHistory::create([
            'order_id' => $order->id,
            'from_status' => $from,
            'to_status' => $toStatus,
            'changed_by' => $changedBy,
            'comment' => $comment,
            'created_at' => now(),
        ]);

        $this->notifyOrderStatusChanged($order, $toStatus, $notifyCustomer);

        return $order->fresh();
    }

    public function capturePayment(Order $order, string $method, float $amount, ?string $providerTxnId = null): Payment
    {
        $payment = Payment::create([
            'order_id' => $order->id,
            'method' => $method,
            'amount' => $amount,
            'status' => 'succeeded',
            'provider_txn_id' => $providerTxnId,
            'paid_at' => now(),
        ]);

        $order->update(['payment_status' => 'paid']);

        if ($order->user) {
            app(AppNotificationService::class)->notify(
                $order->user,
                NotificationAction::PaymentReceived,
                [
                    'order_code' => $order->code,
                    'amount' => (string) $amount,
                    'message' => "Payment of {$amount} received for order {$order->code}.",
                ],
            );
        }

        return $payment;
    }

    public function refundPayment(Order $order, float $amount, ?string $reason = null): Payment
    {
        $payment = Payment::create([
            'order_id' => $order->id,
            'method' => 'card',
            'amount' => $amount,
            'status' => 'refunded',
            'provider_txn_id' => $reason,
            'paid_at' => now(),
        ]);

        $order->update(['payment_status' => 'refunded']);

        if ($order->user) {
            app(AppNotificationService::class)->notify(
                $order->user,
                NotificationAction::PaymentRefunded,
                [
                    'order_code' => $order->code,
                    'amount' => (string) $amount,
                    'message' => "Refund of {$amount} processed for order {$order->code}.",
                ],
            );
        }

        return $payment;
    }

    public function createShipment(Order $order, int $storeId, ?string $carrier, ?string $trackingNo, float $cost = 0): Shipment
    {
        return Shipment::create([
            'order_id' => $order->id,
            'store_id' => $storeId,
            'carrier' => $carrier,
            'tracking_no' => $trackingNo,
            'status' => 'pending',
            'cost' => $cost,
        ]);
    }

    private function notifyOrderStatusChanged(Order $order, string $toStatus, bool $notifyCustomer): void
    {
        if (! $order->user) {
            return;
        }

        $action = match ($toStatus) {
            'confirmed' => NotificationAction::OrderConfirmed,
            'shipped' => NotificationAction::OrderShipped,
            'delivered' => NotificationAction::OrderDelivered,
            'cancelled' => NotificationAction::OrderCancelled,
            'refunded' => NotificationAction::PaymentRefunded,
            default => NotificationAction::OrderStatusUpdated,
        };

        app(AppNotificationService::class)->notify(
            $order->user,
            $action,
            [
                'message' => "Your order {$order->code} is now {$toStatus}.",
                'order_code' => $order->code,
                'status' => $toStatus,
            ],
            $notifyCustomer,
            $notifyCustomer,
        );
    }
}

