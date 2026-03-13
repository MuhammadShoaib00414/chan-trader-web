<?php

namespace App\Traits;

use App\Mail\SendOtpMail;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

trait OtpTrait
{
    /**
     * Generate and save OTP for a user
     */
    protected function generateAndSaveOTP($user, $type = 'verification')
    {
        // Generate 4 digit OTP
        $otp = str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT);

        // Save OTP and expiry time (15 minutes from now)
        $user->update([
            'otp' => Hash::make($otp),
            'otp_expires_at' => Carbon::now()->addMinutes(config('app.otp_expire_time')),
        ]);

        // Send OTP email
        try {
            Mail::to($user->email)->send(new SendOtpMail($otp, $type));
        } catch (\Throwable $e) {
            Log::error('Failed to send OTP email', [
                'email' => $user->email,
                'type' => $type,
                'error' => $e->getMessage(),
            ]);
        }

        // Log OTP for development purposes
        Log::info('OTP Generated', [
            'email' => $user->email,
            'type' => $type,
            'otp' => $otp, // include actual code in log for debugging
            'expires_at' => Carbon::now()->addMinutes(config('app.otp_expire_time'))->toDateTimeString(),
        ]);

        return $otp;
    }

    /**
     * Verify OTP for a user
     */
    protected function verifyUserOTP($user, $otp)
    {
        // record attempt for auditing/debugging
        $logData = [
            'email' => $user->email,
            'provided_otp' => $otp,
        ];

        if (! $user->otp || ! $user->otp_expires_at) {
            Log::warning('OTP verification failed', array_merge($logData, ['reason' => 'no_otp_or_expired']));

            return [false, 'No OTP found or OTP expired'];
        }

        if (Carbon::now()->isAfter($user->otp_expires_at)) {
            Log::warning('OTP verification failed', array_merge($logData, ['reason' => 'expired']));

            return [false, 'OTP has expired'];
        }

        if (! Hash::check($otp, $user->otp)) {
            Log::warning('OTP verification failed', array_merge($logData, ['reason' => 'invalid']));

            return [false, 'Invalid OTP'];
        }

        Log::info('OTP verified successfully', $logData);

        return [true, null];
    }
}
