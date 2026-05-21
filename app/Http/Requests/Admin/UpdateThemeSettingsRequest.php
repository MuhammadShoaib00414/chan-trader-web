<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateThemeSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('edit settings') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $hexRule = ['required', 'string', 'regex:/^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'];

        return [
            'colors' => ['required', 'array'],
            'colors.primary_color' => $hexRule,
            'colors.secondary_color' => $hexRule,
            'colors.button_color' => $hexRule,
            'colors.text_color' => $hexRule,
            'colors.background_color' => $hexRule,
            'colors.header_footer_color' => $hexRule,
            'colors.status_bar_color' => $hexRule,
            'colors.error_color' => $hexRule,
            'colors.success_color' => $hexRule,
            'options' => ['sometimes', 'array'],
            'options.dark_mode_enabled' => ['sometimes', 'boolean'],
            'options.font_family' => ['sometimes', 'nullable', 'string', 'max:100'],
            'options.gradient_enabled' => ['sometimes', 'boolean'],
        ];
    }
}
