<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $email = $this->input('email');
        $phone = $this->input('phone_number');

        if (is_string($email)) {
            $email = mb_strtolower(trim($email));
        }

        if (is_string($phone)) {
            $normalized = preg_replace('/[\s\-\(\)]/', '', $phone);
            if (str_starts_with($normalized, '+92')) {
                $normalized = '0'.substr($normalized, 3);
            } elseif (str_starts_with($normalized, '0092')) {
                $normalized = '0'.substr($normalized, 4);
            } elseif (str_starts_with($normalized, '92') && strlen($normalized) === 12) {
                $normalized = '0'.substr($normalized, 2);
            }
            $phone = $normalized;
        }

        $this->merge([
            'email' => $email,
            'phone_number' => $phone,
        ]);
    }

    public function authorize(): bool
    {
        return true;
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Scribe (and similar tools) resolve rules without an authenticated user; skip this check then.
            if (! $this->user('api')) {
                return;
            }

            $hasField = collect(['first_name', 'last_name', 'email', 'phone_number'])
                ->contains(fn (string $key) => $this->filled($key));

            if (! $hasField) {
                $validator->errors()->add(
                    'profile',
                    'Provide at least one of: first_name, last_name, email, phone_number.'
                );
            }
        });
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->user('api');

        $emailUnique = Rule::unique('users', 'email')->whereNull('deleted_at');
        $phoneUnique = Rule::unique('users', 'phone_number')->whereNull('deleted_at');
        if ($user) {
            $emailUnique = $emailUnique->ignore($user->id);
            $phoneUnique = $phoneUnique->ignore($user->id);
        }

        return [
            'first_name' => ['sometimes', 'string', 'min:1', 'max:255'],
            'last_name' => ['sometimes', 'string', 'min:1', 'max:255'],
            'email' => [
                'sometimes',
                'email',
                'max:255',
                $emailUnique,
            ],
            'phone_number' => [
                'sometimes',
                'regex:/^03\d{9}$/',
                $phoneUnique,
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'The email address is already registered.',
            'phone_number.unique' => 'The phone number is already registered.',
            'phone_number.regex' => 'Phone number must be Pakistani mobile format like 03001234567. You may also enter +923001234567 or 00923001234567.',
        ];
    }
}
