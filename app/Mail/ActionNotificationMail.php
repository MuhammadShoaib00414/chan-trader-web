<?php

namespace App\Mail;

use App\Enums\NotificationAction;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ActionNotificationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        public User $user,
        public NotificationAction $action,
        public array $payload = [],
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->action->emailSubject(),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.action-notification',
            with: [
                'user' => $this->user,
                'action' => $this->action,
                'payload' => $this->payload,
                'appName' => config('app.name'),
            ],
        );
    }

    /**
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
