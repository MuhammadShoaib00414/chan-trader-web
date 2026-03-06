<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SendOtpMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $otp;

    public $type;

    /**
     * Create a new message instance.
     */
    public function __construct($otp, $type)
    {
        $this->otp = $otp;
        $this->type = $type;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $label = str_replace('-', ' ', (string) $this->type);
        $label = ucwords($label);
        return new Envelope(subject: $label.' OTP');
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $view = $this->type === 'verification'
            ? 'emails.otp-verification'
            : 'emails.otp-password-reset';

        return new Content(view: $view);
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
