<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
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
            'email' => 'required|email|max:255|unique:users',
            'phone_number' => ['required','regex:/^03\d{9}$/','unique:users'],
            'password' => 'required|min:8|confirmed',
            'shop_name' => 'required|string|max:255',
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
            'phone_number.regex' => 'Phone number must be in Pakistani format (e.g. 03001234567).',
        ];
    }
}
