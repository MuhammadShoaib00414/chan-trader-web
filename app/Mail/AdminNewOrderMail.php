<?php

namespace App\Mail;

use App\Models\Order;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdminNewOrderMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        public User $admin,
        public array $payload = [],
    ) {}

    public function envelope(): Envelope
    {
        $code = $this->payload['order_code'] ?? '';

        return new Envelope(
            subject: trim("New order received {$code}"),
        );
    }

    public function content(): Content
    {
        $order = null;

        if (! empty($this->payload['order_id'])) {
            $order = Order::with(['items', 'user'])->find($this->payload['order_id']);
        }

        $placedAt = $this->payload['placed_at']
            ?? ($order?->created_at?->toDayDateTimeString())
            ?? '';

        return new Content(
            view: 'emails.admin-new-order',
            with: [
                'admin' => $this->admin,
                'order' => $order,
                'appName' => config('app.name'),
                'customerName' => $this->payload['customer_name']
                    ?? $order?->user?->name
                    ?? 'a customer',
                'orderCode' => $this->payload['order_code'] ?? $order?->code ?? '',
                'grandTotal' => $this->payload['grand_total'] ?? (string) ($order?->grand_total ?? ''),
                'currency' => $this->payload['currency'] ?? $order?->currency ?? '',
                'placedAt' => $placedAt,
                'orderUrl' => ! empty($this->payload['order_id'])
                    ? url('/admin/orders/' . $this->payload['order_id'])
                    : null,
            ],
        );
    }
}
