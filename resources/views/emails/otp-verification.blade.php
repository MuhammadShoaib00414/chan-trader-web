@extends('emails.layouts.base')

@section('title', 'Email Verification — Chan Trader')
@section('preheader', 'Use this one-time password to verify your Chan Trader account.')

@section('content')
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
            <td style="padding-bottom:14px;">
                <h1 style="margin:0; font-family:Arial,Helvetica,sans-serif; color:#111827; font-size:22px; line-height:1.3;">
                    Email Verification
                </h1>
            </td>
        </tr>
        <tr>
            <td style="padding-bottom:10px;">
                <p style="margin:0 0 6px; font-family:Arial,Helvetica,sans-serif; color:#111827; font-size:14px; line-height:1.7;">
                    Hello,
                </p>
                <p style="margin:0; font-family:Arial,Helvetica,sans-serif; color:#4b5563; font-size:14px; line-height:1.7;">
                    Thank you for registering with <strong>Chan Trader</strong>. To complete your registration and verify your email
                    address, please use the One‑Time Password (OTP) below:
                </p>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding:18px 0 8px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:16px; background-color:#fee2e2;">
                    <tr>
                        <td align="center" style="padding:26px 16px 22px;">
                            <div style="display:inline-block; padding:18px 28px; border-radius:14px; background:linear-gradient(135deg,#f97373,#ef4444,#b91c1c);">
                                <span style="display:inline-block; letter-spacing:10px; font-size:34px; color:#ffffff; font-weight:800; font-family:Arial,Helvetica,sans-serif;">
                                    {{ $otp }}
                                </span>
                            </div>
                            <p style="margin:14px 0 0; font-family:Arial,Helvetica,sans-serif; color:#b91c1c; font-size:12px; line-height:1.6;">
                                Your verification code
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="padding-top:14px; padding-bottom:12px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:10px; background-color:#fef2f2; border:1px solid #fecaca;">
                    <tr>
                        <td style="padding:12px 14px;">
                            <p style="margin:0; font-family:Arial,Helvetica,sans-serif; color:#991b1b; font-size:12px; line-height:1.6;">
                                <strong>Important:</strong> This code will expire in {{ config('app.otp_expire_time') }} minutes. Please use it promptly.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="padding-bottom:16px;">
                <p style="margin:0; font-family:Arial,Helvetica,sans-serif; color:#4b5563; font-size:13px; line-height:1.7;">
                    Once verified, you will be able to log in and access all features of your Chan Trader account.
                </p>
            </td>
        </tr>
        <tr>
            <td style="padding-bottom:14px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:10px; background-color:#f9fafb; border:1px solid #e5e7eb;">
                    <tr>
                        <td style="padding:12px 14px;">
                            <p style="margin:0; font-family:Arial,Helvetica,sans-serif; color:#374151; font-size:12px; line-height:1.6;">
                                <strong>Security note:</strong> If you did not request this code, please ignore this email. Your account will remain secure and no changes will be made.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="padding-bottom:16px;">
                <a href="{{ config('app.url') }}"
                   style="display:inline-block; background-color:#ef4444; color:#ffffff; padding:10px 20px; border-radius:999px; font-family:Arial,Helvetica,sans-serif; font-size:14px; font-weight:700;">
                    Open Chan Trader
                </a>
            </td>
        </tr>
        <tr>
            <td>
                <p style="margin:0 0 4px; font-family:Arial,Helvetica,sans-serif; color:#111827; font-size:13px; line-height:1.7;">
                    Best regards,
                </p>
                <p style="margin:0; font-family:Arial,Helvetica,sans-serif; color:#111827; font-size:13px; line-height:1.7; font-weight:600;">
                    Chan Trader Team
                </p>
            </td>
        </tr>
    </table>
@endsection
