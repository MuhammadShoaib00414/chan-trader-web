<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class AppleLoginRequest extends FormRequest
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
            'identityToken' => 'required|string',
            'authorizationCode' => 'nullable|string',
            'grant_type' => 'nullable|string|in:password,client_credentials,authorization_code',
            'client_id' => 'required|string',
            'client_secret' => 'required|string',
        ];
    }

    /**
     * Get custom error messages for validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'identityToken.required' => 'Apple identity token is required.',
            'identityToken.string' => 'Apple identity token must be a string.',
            'authorizationCode.string' => 'Apple authorization code must be a string.',
            'is_customer.required' => 'User type (customer/provider) is required.',
            'is_customer.boolean' => 'User type must be true for customer or false for provider.',
            'grant_type.in' => 'Grant type must be one of: password, client_credentials, authorization_code.',
            'client_id.required' => 'Client ID is required.',
            'client_secret.required' => 'Client secret is required.',
        ];
    }
}
