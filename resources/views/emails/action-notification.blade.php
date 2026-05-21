<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $action->emailSubject() }}</title>
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
    <p>Hello {{ $user->first_name ?? $user->name ?? 'there' }},</p>

    <p>{{ $payload['message'] ?? $action->label() }}</p>

    @if (! empty($payload['order_code']))
        <p><strong>Order:</strong> {{ $payload['order_code'] }}</p>
    @endif

    @if (! empty($payload['status']))
        <p><strong>Status:</strong> {{ $payload['status'] }}</p>
    @endif

    <p>Thanks,<br>{{ $appName }}</p>
</body>
</html>
