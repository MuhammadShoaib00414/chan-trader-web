<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class SendTokenNotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // restrict to admin roles when not testing
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'token'   => ['required', 'string'],
            'title'   => ['required', 'string', 'max:255'],
            'body'    => ['required', 'string', 'max:1000'],
            'data'    => ['nullable', 'array'],
            'data.*'  => ['string'],
            'user_id' => ['nullable', 'string'],
            'order_id'=> ['nullable', 'string'],
            'type'    => ['nullable', 'string'],
            'screen'  => ['nullable', 'string'],
        ];
    }

    /**
     * Merge any top-level shorthand fields (user_id, order_id, type, screen) into data[].
     */
    protected function prepareForValidation(): void
    {
        $extra = array_filter([
            'user_id'  => $this->input('user_id'),
            'order_id' => $this->input('order_id'),
            'type'     => $this->input('type'),
            'screen'   => $this->input('screen'),
        ], fn ($v) => $v !== null);

        if ($extra) {
            $this->merge([
                'data' => array_merge((array) ($this->input('data') ?? []), array_map('strval', $extra)),
            ]);
        }
    }
}
