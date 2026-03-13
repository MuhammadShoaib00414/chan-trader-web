<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>@yield('title', 'Chan Trader')</title>
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
        a { text-decoration: none; }
        @media screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .p-24 { padding: 16px !important; }
            .header-title { font-size: 20px !important; }
            .header-subtitle { font-size: 12px !important; }
        }
    </style>
</head>
<body style="background-color:#f3f4f6; margin:0; padding:0;">
    <span style="display:none; color:transparent; opacity:0; visibility:hidden; height:0; width:0; overflow:hidden;">
        @yield('preheader', '')
    </span>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
            <td align="center" style="padding:32px 12px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container" style="width:600px; max-width:100%; background-color:#ffffff; border-radius:16px; box-shadow:0 10px 30px rgba(15,23,42,0.15); overflow:hidden;">
                    <tr>
                        <td align="left" style="padding:20px 24px; background:linear-gradient(135deg,#f97373,#ef4444,#b91c1c);">
                            <table role="presentation" width="100%">
                                <tr>
                                    <td align="left" style="vertical-align:middle;">
                                        <a href="{{ config('app.url') }}" style="display:inline-flex; align-items:center;">
                                            <img src="{{ asset('logo.svg') }}" alt="Chan Trader logo" style="display:block; height:40px; width:auto;">
                                            <span style="margin-left:12px;">
                                                <span class="header-title" style="display:block; color:#ffffff; font-size:22px; font-weight:700; font-family:Arial,Helvetica,sans-serif; letter-spacing:0.03em;">
                                                    Chan Trader
                                                </span>
                                                <span class="header-subtitle" style="display:block; color:#fee2e2; font-size:13px; font-family:Arial,Helvetica,sans-serif; margin-top:3px;">
                                                    Secure Trading Portal
                                                </span>
                                            </span>
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:0 24px;">
                            <div style="height:3px; width:100%; background-color:#fca5a5; border-radius:999px;"></div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <table role="presentation" width="100%">
                                <tr>
                                    <td class="p-24" style="padding:32px 24px 24px;">
                                        @yield('content')
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:20px 24px 24px; border-top:1px solid #e5e7eb; background-color:#f9fafb;">
                            <table role="presentation" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom:8px;">
                                        <p style="margin:0; color:#6b7280; font-size:11px; font-family:Arial,Helvetica,sans-serif;">
                                            This email was sent by <strong>Chan Trader</strong>. If you have any questions, please contact our support team at
                                            <a href="mailto:{{ config('mail.from.address') }}" style="color:#b91c1c;">{{ config('mail.from.address') }}</a>.
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <p style="margin:0; color:#9ca3af; font-size:11px; font-family:Arial,Helvetica,sans-serif;">
                                            © {{ now()->year }} Chan Trader. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
