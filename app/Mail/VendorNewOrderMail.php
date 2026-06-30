<?php

namespace App\Mail;

use App\Models\Order;
use App\Models\Store;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VendorNewOrderMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        public User $vendor,
        public array $payload = [],
    ) {}

    public function envelope(): Envelope
    {
        $code = $this->payload['order_code'] ?? '';

        return new Envelope(
            subject: trim("New order for your store {$code}"),
        );
    }

    public function content(): Content
    {
        $order = null;
        $vendorItems = collect();
        $storeName = null;

        if (! empty($this->payload['order_id'])) {
            $order = Order::with(['items', 'user'])->find($this->payload['order_id']);

            if ($order) {
                $vendorStoreIds = Store::query()
                    ->where('owner_id', $this->vendor->id)
                    ->pluck('id');

                $vendorItems = $order->items->whereIn('store_id', $vendorStoreIds);
                $storeName = Store::query()
                    ->where('owner_id', $this->vendor->id)
                    ->whereIn('id', $vendorItems->pluck('store_id')->unique())
                    ->value('name');
            }
        }

        $placedAt = $this->payload['placed_at']
            ?? ($order?->created_at?->toDayDateTimeString())
            ?? '';

        $vendorTotal = $this->payload['grand_total']
            ?? (string) $vendorItems->sum('subtotal');

        return new Content(
            view: 'emails.vendor-new-order',
            with: [
                'vendor' => $this->vendor,
                'order' => $order,
                'vendorItems' => $vendorItems,
                'storeName' => $storeName,
                'appName' => config('app.name'),
                'customerName' => $this->payload['customer_name']
                    ?? $order?->user?->name
                    ?? 'a customer',
                'orderCode' => $this->payload['order_code'] ?? $order?->code ?? '',
                'grandTotal' => $vendorTotal,
                'currency' => $this->payload['currency'] ?? $order?->currency ?? '',
                'placedAt' => $placedAt,
            ],
        );
    }
}
