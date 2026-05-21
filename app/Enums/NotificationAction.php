<?php

namespace App\Enums;

enum NotificationAction: string
{
    case Welcome = 'welcome';
    case EmailVerificationOtp = 'email_verification_otp';
    case PasswordResetOtp = 'password_reset_otp';
    case OrderPlaced = 'order_placed';
    case OrderConfirmed = 'order_confirmed';
    case OrderStatusUpdated = 'order_status_updated';
    case OrderCancelled = 'order_cancelled';
    case OrderShipped = 'order_shipped';
    case OrderDelivered = 'order_delivered';
    case PaymentReceived = 'payment_received';
    case PaymentFailed = 'payment_failed';
    case PaymentRefunded = 'payment_refunded';
    case StoreApproved = 'store_approved';
    case StoreSuspended = 'store_suspended';
    case VendorCreated = 'vendor_created';
    case ReturnRequested = 'return_requested';
    case ReviewSubmitted = 'review_submitted';
    case AccountDeleted = 'account_deleted';

    /**
     * @return list<self>
     */
    public static function all(): array
    {
        return self::cases();
    }

    public function supportsEmail(): bool
    {
        return match ($this) {
            self::Welcome,
            self::EmailVerificationOtp,
            self::PasswordResetOtp,
            self::OrderPlaced,
            self::OrderConfirmed,
            self::OrderStatusUpdated,
            self::OrderCancelled,
            self::OrderShipped,
            self::OrderDelivered,
            self::PaymentReceived,
            self::PaymentFailed,
            self::PaymentRefunded,
            self::StoreApproved,
            self::StoreSuspended,
            self::VendorCreated,
            self::ReturnRequested,
            self::ReviewSubmitted,
            self::AccountDeleted => true,
        };
    }

    public function supportsPush(): bool
    {
        return match ($this) {
            self::EmailVerificationOtp,
            self::PasswordResetOtp => false,
            default => true,
        };
    }

    public function emailSubject(): string
    {
        $app = config('app.name');

        return match ($this) {
            self::Welcome => "Welcome to {$app}!",
            self::EmailVerificationOtp => 'Verify your email',
            self::PasswordResetOtp => 'Reset your password',
            self::OrderPlaced => 'Order placed successfully',
            self::OrderConfirmed => 'Order confirmed',
            self::OrderStatusUpdated => 'Order status updated',
            self::OrderCancelled => 'Order cancelled',
            self::OrderShipped => 'Your order has shipped',
            self::OrderDelivered => 'Your order was delivered',
            self::PaymentReceived => 'Payment received',
            self::PaymentFailed => 'Payment failed',
            self::PaymentRefunded => 'Payment refunded',
            self::StoreApproved => 'Store approved',
            self::StoreSuspended => 'Store suspended',
            self::VendorCreated => 'Vendor account created',
            self::ReturnRequested => 'Return request received',
            self::ReviewSubmitted => 'New product review',
            self::AccountDeleted => 'Account deleted',
        };
    }

    public function pushTitle(): string
    {
        return match ($this) {
            self::Welcome => 'Welcome!',
            self::OrderPlaced => 'Order placed',
            self::OrderConfirmed => 'Order confirmed',
            self::OrderStatusUpdated => 'Order update',
            self::OrderCancelled => 'Order cancelled',
            self::OrderShipped => 'Order shipped',
            self::OrderDelivered => 'Order delivered',
            self::PaymentReceived => 'Payment received',
            self::PaymentFailed => 'Payment failed',
            self::PaymentRefunded => 'Refund processed',
            self::StoreApproved => 'Store approved',
            self::StoreSuspended => 'Store suspended',
            self::VendorCreated => 'Vendor account',
            self::ReturnRequested => 'Return requested',
            self::ReviewSubmitted => 'New review',
            self::AccountDeleted => 'Account deleted',
            default => config('app.name'),
        };
    }

    public function label(): string
    {
        return str($this->value)->headline()->toString();
    }
}
