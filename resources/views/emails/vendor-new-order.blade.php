<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New order for your store</title>
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333; background:#f6f6f6; margin:0; padding:24px;">
    <div style="max-width:600px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden; border:1px solid #eee;">
        <div style="background:#111827; color:#fff; padding:16px 24px;">
            <h2 style="margin:0; font-size:18px;">🛍️ New Order For Your Store</h2>
        </div>

        <div style="padding:24px;">
            <p style="margin-top:0;">Hello {{ $vendor->first_name ?? $vendor->name ?? 'Vendor' }},</p>

            <p>A customer placed a new order that includes products from <strong>{{ $storeName ?? 'your store' }}</strong>.</p>

            <table style="width:100%; border-collapse:collapse; margin:16px 0;">
                <tr>
                    <td style="padding:6px 0; color:#6b7280;">Customer</td>
                    <td style="padding:6px 0; text-align:right;"><strong>{{ $customerName }}</strong></td>
                </tr>
                <tr>
                    <td style="padding:6px 0; color:#6b7280;">Order Number</td>
                    <td style="padding:6px 0; text-align:right;"><strong>{{ $orderCode }}</strong></td>
                </tr>
                <tr>
                    <td style="padding:6px 0; color:#6b7280;">Your Items Total</td>
                    <td style="padding:6px 0; text-align:right;"><strong>{{ trim($currency . ' ' . $grandTotal) }}</strong></td>
                </tr>
                <tr>
                    <td style="padding:6px 0; color:#6b7280;">Order Date &amp; Time</td>
                    <td style="padding:6px 0; text-align:right;"><strong>{{ $placedAt }}</strong></td>
                </tr>
            </table>

            @if ($vendorItems->count())
                <h3 style="font-size:15px; margin-bottom:8px;">Your Products In This Order</h3>
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
                        @foreach ($vendorItems as $item)
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
                </table>
            @endif

            <p style="margin-top:24px; color:#6b7280;">Open the vendor app to review and fulfill this order.</p>
            <p style="margin-top:24px; color:#6b7280;">Thanks,<br>{{ $appName }}</p>
        </div>
    </div>
</body>
</html>
