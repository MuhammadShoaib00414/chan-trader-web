<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class CheckUserRequest extends FormRequest
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
            'token' => 'required|string',
            'provider' => 'required|string|in:google,apple',
            'grant_type' => 'nullable|string|in:password,client_credentials,authorization_code',
            'client_id' => 'required|string',
            'client_secret' => 'required|string',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'token.required' => 'Social login token is required.',
            'token.string' => 'Social login token must be a string.',
            'provider.required' => 'Social provider is required.',
            'provider.in' => 'Provider must be either google or apple.',
        ];
    }
}
