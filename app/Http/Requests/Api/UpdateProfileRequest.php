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

            $hasField = collect([
                'first_name',
                'last_name',
                'email',
                'phone_number',
                'shop_name',
                'city_district',
                'address',
                'avatar',
                'cover_image',
            ])
                ->contains(fn (string $key) => $this->filled($key) || $this->hasFile($key));

            if (! $hasField) {
                $validator->errors()->add(
                    'profile',
                    'Provide at least one of: first_name, last_name, email, phone_number, shop_name, city_district, address, avatar, cover_image.'
                );
            }
        });
    }

    /**
     * Body parameters for API documentation.
     * 
     * @return array<string, array>
     */
    public function bodyParameters(): array
    {
        return [
            'first_name' => [
                'description' => "User's first name",
                'example' => 'John',
            ],
            'last_name' => [
                'description' => "User's last name",
                'example' => 'Doe',
            ],
            'email' => [
                'description' => "User's email address",
                'example' => 'john@example.com',
            ],
            'phone_number' => [
                'description' => 'Pakistani mobile format (03XX XXXXXXX)',
                'example' => '03001234567',
            ],
            'avatar' => [
                'description' => "User's profile picture (JPEG, PNG, JPG, GIF, max 2MB)",
                'example' => null,
            ],
            'cover_image' => [
                'description' => "User's profile cover/banner image (JPEG, PNG, JPG, GIF, max 5MB)",
                'example' => null,
            ],
        ];
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
                'nullable',
                'regex:/^03\d{9}$/',
                $phoneUnique,
            ],
            'shop_name' => ['sometimes', 'nullable', 'string', 'max:150'],
            'city_district' => ['sometimes', 'nullable', 'string', 'max:150'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'avatar' => [
                'sometimes',
                'file',
                'mimes:jpeg,png,jpg,gif',
                'max:2048', // 2MB
            ],
            'cover_image' => [
                'sometimes',
                'file',
                'mimes:jpeg,png,jpg,gif',
                'max:5120', // 5MB
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'The email address is already registered.',
            'phone_number.unique' => 'The phone number is already registered.',
            'phone_number.regex' => 'Phone number must be Pakistani mobile format like 03001234567. You may also enter +923001234567 or 00923001234567.',
            'avatar.mimes' => 'Avatar must be a valid image file (JPEG, PNG, JPG, or GIF).',
            'avatar.max' => 'Avatar file size must be less than 2MB.',
            'cover_image.mimes' => 'Cover image must be a valid image file (JPEG, PNG, JPG, or GIF).',
            'cover_image.max' => 'Cover image file size must be less than 5MB.',
        ];
    }
}
