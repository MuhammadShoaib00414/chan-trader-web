@extends('emails.layouts.base')

@section('title', 'Welcome to '.config('app.name'))
@section('preheader', 'Welcome to '.config('app.name').' — your marketplace for electronic parts.')

@section('content')
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
            <td style="padding-bottom:12px;">
                <h1 style="margin:0; font-family:Arial,Helvetica,sans-serif; color:#e2e8f0; font-size:22px; line-height:1.3;">
                    Welcome to {{ config('app.name') }}{{ isset($user->first_name) ? ', '.$user->first_name : '' }}!
                </h1>
            </td>
        </tr>
        <tr>
            <td style="padding-bottom:14px;">
                <p style="margin:0; font-family:Arial,Helvetica,sans-serif; color:#cbd5e1; font-size:14px; line-height:1.6;">
                    You’re all set to explore a modern marketplace for electronic components. Source parts from trusted vendors, compare specs, and track orders with ease.
                </p>
            </td>
        </tr>
        <tr>
            <td style="padding:12px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0f172a; border:1px solid #1f2a44; border-radius:8px;">
                    <tr>
                        <td style="padding:14px 16px;">
                            <ul style="margin:0; padding-left:18px; color:#cbd5e1; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:1.6;">
                                <li>Verified sellers and transparent ratings</li>
                                <li>Detailed specifications for quick comparison</li>
                                <li>Secure checkout and real-time tracking</li>
                                <li>Smart search to find exact components fast</li>
                            </ul>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td align="left" style="padding-top:18px; padding-bottom:24px;">
                <a href="{{ $loginUrl ?? config('app.url') }}"
                   style="display:inline-block; background:linear-gradient(90deg,#0ea5e9,#22d3ee); color:#0b1222; padding:12px 18px; border-radius:8px; font-family:Arial,Helvetica,sans-serif; font-size:14px; font-weight:700;">
                    Visit Dashboard
                </a>
            </td>
        </tr>
        <tr>
            <td>
                <p style="margin:0; font-family:Arial,Helvetica,sans-serif; color:#94a3b8; font-size:12px; line-height:1.6;">
                    If you didn’t create this account, you can safely ignore this email.
                </p>
            </td>
        </tr>
    </table>
@endsection
