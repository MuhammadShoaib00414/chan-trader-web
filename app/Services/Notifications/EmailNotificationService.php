<?php

namespace App\Services\Notifications;

use App\Enums\NotificationAction;
use App\Mail\ActionNotificationMail;
use App\Mail\SendOtpMail;
use App\Mail\WelcomeEmail;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class EmailNotificationService
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function send(User $user, NotificationAction $action, array $payload = []): bool
    {
        if (! $action->supportsEmail()) {
            return false;
        }

        $settings = Setting::getGroup('notifications');
        if (! ($settings['email_notifications_enabled'] ?? true)) {
            return false;
        }

        if (! $user->email) {
            return false;
        }

        return match ($action) {
            NotificationAction::Welcome => $this->sendWelcome($user),
            NotificationAction::EmailVerificationOtp,
            NotificationAction::PasswordResetOtp => $this->sendOtp($user, $action, $payload),
            default => $this->sendActionMail($user, $action, $payload),
        };
    }

    private function sendWelcome(User $user): bool
    {
        Mail::to($user->email)->queue(new WelcomeEmail($user));

        return true;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function sendOtp(User $user, NotificationAction $action, array $payload): bool
    {
        $otp = (string) ($payload['otp'] ?? '');
        $type = $action === NotificationAction::EmailVerificationOtp ? 'verification' : 'password-reset';

        if ($otp === '') {
            return false;
        }

        Mail::to($user->email)->queue(new SendOtpMail($otp, $type));

        return true;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function sendActionMail(User $user, NotificationAction $action, array $payload): bool
    {
        Mail::to($user->email)->queue(new ActionNotificationMail($user, $action, $payload));

        return true;
    }
}
