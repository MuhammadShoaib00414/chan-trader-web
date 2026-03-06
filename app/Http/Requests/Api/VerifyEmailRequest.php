<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class VerifyEmailRequest extends FormRequest
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
            'email' => [
                'required',
                'email:rfc,dns',
                function ($attribute, $value, $fail) {
                    $query = \App\Models\User::where(function ($q) use ($value) {
                        $q->where('email', $value)
                            ->orWhere('pending_email', $value);
                    });

                    if (! $query->exists()) {
                        $fail('The selected email is invalid.');
                    }
                },
            ],
            'otp' => 'required|digits:4',
        ];
    }
}
