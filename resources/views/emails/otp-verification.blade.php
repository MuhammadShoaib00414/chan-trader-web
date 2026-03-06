@extends('emails.layouts.base')

@section('title', 'Verify your email — '.config('app.name'))
@section('preheader', 'Use the verification code to activate your account.')

@section('content')
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
            <td style="padding-bottom:12px;">
                <h1 style="margin:0; font-family:Arial,Helvetica,sans-serif; color:#e2e8f0; font-size:20px; line-height:1.3;">
                    Verify your email
                </h1>
            </td>
        </tr>
        <tr>
            <td style="padding-bottom:14px;">
                <p style="margin:0; font-family:Arial,Helvetica,sans-serif; color:#cbd5e1; font-size:14px; line-height:1.6;">
                    Enter the code below in the app to verify your email and activate your account.
                </p>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding:10px 0 16px;">
                <div style="display:inline-block; padding:14px 18px; border-radius:10px; background:#0f172a; border:1px solid #1f2a44;">
                    <span style="letter-spacing:6px; font-size:28px; color:#0ea5e9; font-weight:700; font-family:Arial,Helvetica,sans-serif;">
                        {{ $otp }}
                    </span>
                </div>
            </td>
        </tr>
        <tr>
            <td>
                <p style="margin:0; font-family:Arial,Helvetica,sans-serif; color:#94a3b8; font-size:12px; line-height:1.6;">
                    This code expires in {{ config('app.otp_expire_time') }} minutes. If you didn’t request this, please ignore this email.
                </p>
            </td>
        </tr>
    </table>
@endsection
