<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>@yield('title', config('app.name'))</title>
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; }
        body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
        a { text-decoration: none; }
        @media screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .p-24 { padding: 16px !important; }
        }
    </style>
</head>
<body style="background-color:#0f172a; margin:0; padding:0;">
    <span style="display:none; color:transparent; opacity:0; visibility:hidden; height:0; width:0; overflow:hidden;">
        @yield('preheader', '')
    </span>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
            <td align="center" style="padding:24px 12px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container" style="width:600px; max-width:100%;">
                    <tr>
                        <td align="left" style="background:#0b1222; border:1px solid #1f2a44; border-bottom:0; border-radius:10px 10px 0 0; padding:20px;">
                            <table role="presentation" width="100%">
                                <tr>
                                    <td align="left" style="vertical-align:middle;">
                                        <a href="{{ config('app.url') }}" style="display:inline-flex; align-items:center;">
                                            <span style="display:inline-flex; align-items:center; justify-content:center; width:40px; height:40px; border-radius:8px; background:#0ea5e9; color:#0b1222; font-weight:700; font-family:Arial,Helvetica,sans-serif;">
                                                {{ mb_substr(config('app.name'),0,1) }}
                                            </span>
                                            <span style="margin-left:12px; color:#e2e8f0; font-size:18px; font-family:Arial,Helvetica,sans-serif;">{{ config('app.name') }}</span>
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#0b1222; border:1px solid #1f2a44; border-top:0; border-bottom:0;">
                            <table role="presentation" width="100%">
                                <tr>
                                    <td style="padding:8px 20px;">
                                        <div style="height:2px; width:100%; background:linear-gradient(90deg, #0ea5e9, #22d3ee); border-radius:2px;"></div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#0b1222; border-left:1px solid #1f2a44; border-right:1px solid #1f2a44;">
                            <table role="presentation" width="100%">
                                <tr>
                                    <td class="p-24" style="padding:24px;">
                                        @yield('content')
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#0b1222; border:1px solid #1f2a44; border-top:0; border-radius:0 0 10px 10px;">
                            <table role="presentation" width="100%">
                                <tr>
                                    <td style="padding:20px;">
                                        <table role="presentation" width="100%">
                                            <tr>
                                                <td align="center" style="padding-bottom:12px;">
                                                    <a href="{{ config('app.url') }}" style="color:#94a3b8; font-size:13px; font-family:Arial,Helvetica,sans-serif;">{{ parse_url(config('app.url'), PHP_URL_HOST) }}</a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center">
                                                    <p style="margin:0; color:#64748b; font-size:12px; font-family:Arial,Helvetica,sans-serif;">
                                                        © {{ now()->year }} {{ config('app.name') }}. All rights reserved.
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
            </td>
        </tr>
    </table>
</body>
</html>
