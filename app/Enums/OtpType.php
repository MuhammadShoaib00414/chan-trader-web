<?php

namespace App\Enums;

use Illuminate\Validation\Rule;

enum OtpType: string
{
    case EMAIL_VERIFICATION = 'verification';
    case PASSWORD_RESET = 'password-reset';

    public function requiresVerifiedEmail(): bool
    {
        return match ($this) {
            self::EMAIL_VERIFICATION => false,
            self::PASSWORD_RESET => false,
        };
    }

    public function getMessage(): string
    {
        return match ($this) {
            self::EMAIL_VERIFICATION => 'Verification code has been sent to your email',
            self::PASSWORD_RESET => 'Password reset code has been sent to your email',
        };
    }

    public function getErrorPrefix(): string
    {
        return match ($this) {
            self::EMAIL_VERIFICATION => 'verification code',
            self::PASSWORD_RESET => 'reset code',
        };
    }

    public function getValidationRules(): array
    {
        return [
            'email' => ['required', 'email', Rule::exists('users', 'email')->whereNull('deleted_at')],
        ];
    }
}
