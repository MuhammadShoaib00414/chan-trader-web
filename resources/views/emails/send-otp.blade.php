<!DOCTYPE html>
<html>
<head>
    <title>{{ ucfirst($type) }} OTP</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .otp-container {
            background-color: #f8f9fa;
            border-radius: 5px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .otp-code {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #007bff;
        }
        .expiry-note {
            color: #6c757d;
            font-size: 14px;
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <h2>{{ ucfirst($type) }} OTP</h2>
    <p>Hello,</p>
    
    @if($type == 'verification')
        <p>Your email verification OTP code is:</p>
    @else
        <p>Your password reset OTP code is:</p>
    @endif
    
    <div class="otp-container">
        <div class="otp-code">{{ $otp }}</div>
    </div>

    <p>Please use this code to {{ $type == 'verification' ? 'verify your email address' : 'reset your password' }}. This code will expire in 15 minutes.</p>

    <p class="expiry-note">If you didn't request this code, please ignore this email.</p>

    <p>Best regards,<br>{{ config('app.name') }}</p>
</body>
</html> 