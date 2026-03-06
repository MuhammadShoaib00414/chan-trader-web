<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
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
                $normalized = '0' . substr($normalized, 3);
            } elseif (str_starts_with($normalized, '0092')) {
                $normalized = '0' . substr($normalized, 4);
            } elseif (str_starts_with($normalized, '92') && strlen($normalized) === 12) {
                $normalized = '0' . substr($normalized, 2);
            }
            $phone = $normalized;
        }

        $this->merge([
            'email' => $email,
            'phone_number' => $phone,
        ]);
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'full_name' => 'required|string|min:3|max:255',
            'email' => 'required|email:rfc,dns|max:255|unique:users,email',
            'phone_number' => ['required','regex:/^03\d{9}$/','unique:users,phone_number'],
            'password' => 'required|min:8|confirmed',
            // 'shop_name' => 'required|string|max:255',
            'city_district' => 'required|string|max:255',
            'address' => 'required|string',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:1024',
        ];
    }

    /**
     * Custom error messages for validation rules.
     *
     * @return array<string,string>
     */
    public function messages(): array
    {
        return [
            'email.unique' => 'The email address is already registered.',
            'phone_number.unique' => 'The phone number is already registered.',
            'phone_number.regex' => 'Phone number must be Pakistani mobile format like 03001234567. You may also enter +923001234567 or 00923001234567.',
        ];
    }
}
