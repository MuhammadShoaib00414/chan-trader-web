<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New order received</title>
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333; background:#f6f6f6; margin:0; padding:24px;">
    <div style="max-width:600px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden; border:1px solid #eee;">
        <div style="background:#111827; color:#fff; padding:16px 24px;">
            <h2 style="margin:0; font-size:18px;">🛒 New Order Received</h2>
        </div>

        <div style="padding:24px;">
            <p style="margin-top:0;">Hello {{ $admin->first_name ?? $admin->name ?? 'Admin' }},</p>

            <p>A new order has been placed by <strong>{{ $customerName }}</strong>.</p>

            <table style="width:100%; border-collapse:collapse; margin:16px 0;">
                <tr>
                    <td style="padding:6px 0; color:#6b7280;">Customer Name</td>
                    <td style="padding:6px 0; text-align:right;"><strong>{{ $customerName }}</strong></td>
                </tr>
                <tr>
                    <td style="padding:6px 0; color:#6b7280;">Order Number</td>
                    <td style="padding:6px 0; text-align:right;"><strong>{{ $orderCode }}</strong></td>
                </tr>
                <tr>
                    <td style="padding:6px 0; color:#6b7280;">Order Amount</td>
                    <td style="padding:6px 0; text-align:right;"><strong>{{ trim($currency . ' ' . $grandTotal) }}</strong></td>
                </tr>
                <tr>
                    <td style="padding:6px 0; color:#6b7280;">Order Date &amp; Time</td>
                    <td style="padding:6px 0; text-align:right;"><strong>{{ $placedAt }}</strong></td>
                </tr>
            </table>

            @if ($order && $order->items->count())
                <h3 style="font-size:15px; margin-bottom:8px;">Order Details</h3>
                <table style="width:100%; border-collapse:collapse; font-size:14px;">
                    <thead>
                        <tr style="border-bottom:2px solid #e5e7eb; text-align:left;">
                            <th style="padding:8px 4px;">Item</th>
                            <th style="padding:8px 4px; text-align:center;">Qty</th>
                            <th style="padding:8px 4px; text-align:right;">Unit</th>
                            <th style="padding:8px 4px; text-align:right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($order->items as $item)
                            <tr style="border-bottom:1px solid #f1f1f1;">
                                <td style="padding:8px 4px;">
                                    {{ $item->name }}
                                    @if ($item->sku)
                                        <br><span style="color:#9ca3af; font-size:12px;">SKU: {{ $item->sku }}</span>
                                    @endif
                                </td>
                                <td style="padding:8px 4px; text-align:center;">{{ $item->quantity }}</td>
                                <td style="padding:8px 4px; text-align:right;">{{ $item->unit_price }}</td>
                                <td style="padding:8px 4px; text-align:right;">{{ $item->subtotal }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="padding:10px 4px; text-align:right; font-weight:bold;">Grand Total</td>
                            <td style="padding:10px 4px; text-align:right; font-weight:bold;">{{ trim($currency . ' ' . $grandTotal) }}</td>
                        </tr>
                    </tfoot>
                </table>
            @endif

            @if ($orderUrl)
                <p style="margin-top:24px;">
                    <a href="{{ $orderUrl }}" style="display:inline-block; background:#2563eb; color:#fff; text-decoration:none; padding:10px 20px; border-radius:6px;">View Order Details</a>
                </p>
            @endif

            <p style="margin-top:24px; color:#6b7280;">Thanks,<br>{{ $appName }}</p>
        </div>
    </div>
</body>
</html>
