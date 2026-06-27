<?php

namespace App\Enums;

enum NotificationAction: string
{
    case Welcome = 'welcome';
    case EmailVerificationOtp = 'email_verification_otp';
    case PasswordResetOtp = 'password_reset_otp';
    case PasswordChanged = 'password_changed';
    case PasswordReset = 'password_reset';
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
    case AdminNewOrder = 'admin_new_order';
    case VendorNewOrder = 'vendor_new_order';

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
            // Admins/super-admins receive an email when a new order is placed.
            self::VendorNewOrder => false,
            default => true,
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

    /** Whether this notification should be persisted to the app_notifications table. */
    public function shouldPersist(): bool
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
            self::PasswordChanged => 'Your password has been changed',
            self::PasswordReset => 'Your password has been reset',
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
            self::AdminNewOrder, self::VendorNewOrder => 'New order received',
        };
    }

    public function pushTitle(): string
    {
        return match ($this) {
            self::Welcome => 'Welcome!',
            self::PasswordChanged => 'Password changed',
            self::PasswordReset => 'Password reset',
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
            self::AdminNewOrder => 'New order',
            self::VendorNewOrder => 'New order',
            default => config('app.name'),
        };
    }

    public function label(): string
    {
        return str($this->value)->headline()->toString();
    }

    /** Build the notification body from the payload, falling back to sensible defaults. */
    public function notificationBody(array $payload = []): string
    {
        if (isset($payload['message'])) {
            return (string) $payload['message'];
        }

        $code = $payload['order_code'] ?? '';
        $app = config('app.name');

        return match ($this) {
            self::Welcome => "Welcome to {$app}! Your account is now active.",
            self::PasswordChanged => 'Your password has been changed successfully.',
            self::PasswordReset => 'Your password has been reset successfully.',
            self::OrderPlaced => "Your order {$code} has been placed successfully.",
            self::OrderConfirmed => "Your order {$code} has been confirmed.",
            self::OrderStatusUpdated => "Your order {$code} status has been updated.",
            self::OrderCancelled => "Your order {$code} has been cancelled.",
            self::OrderShipped => "Your order {$code} has been shipped.",
            self::OrderDelivered => "Your order {$code} has been delivered.",
            self::PaymentReceived => "Payment received for order {$code}.",
            self::PaymentFailed => "Payment failed for order {$code}.",
            self::PaymentRefunded => "Refund processed for order {$code}.",
            self::StoreApproved => 'Your store has been approved.',
            self::StoreSuspended => 'Your store has been suspended.',
            self::VendorCreated => "Your vendor account on {$app} has been created.",
            self::ReturnRequested => "Return request submitted for order {$code}.",
            self::ReviewSubmitted => 'A new review has been submitted.',
            self::AccountDeleted => 'Your account has been deleted.',
            self::AdminNewOrder => "New order {$code} placed by " . ($payload['customer_name'] ?? 'a customer') . '.',
            self::VendorNewOrder => "New order {$code} received for your store.",
            default => $this->label(),
        };
    }
}
