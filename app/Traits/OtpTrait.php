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
            'otp' => $otp,
            'otp_expires_at' => Carbon::now()->addMinutes(config('app.otp_expire_time')),
        ]);

        // Send OTP email
        Mail::to($user->email)->send(new SendOtpMail($otp, $type));

        // Log OTP for development purposes
        Log::info('OTP Generated', [
            'email' => $user->email,
            'type' => $type,
            'expires_at' => Carbon::now()->addMinutes(config('app.otp_expire_time'))->toDateTimeString(),
        ]);

        return $otp;
    }

    /**
     * Verify OTP for a user
     */
    protected function verifyUserOTP($user, $otp)
    {
        if (! $user->otp || ! $user->otp_expires_at) {
            return [false, 'No OTP found or OTP expired'];
        }

        if (Carbon::now()->isAfter($user->otp_expires_at)) {
            return [false, 'OTP has expired'];
        }

        if (! Hash::check($otp, $user->otp)) {
            return [false, 'Invalid OTP'];
        }

        return [true, null];
    }
}
