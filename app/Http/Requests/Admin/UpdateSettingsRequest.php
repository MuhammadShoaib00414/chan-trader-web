<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
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
        return [
            'settings' => ['required', 'array'],
            'settings.general' => ['sometimes', 'array'],
            'settings.general.app_display_name' => ['sometimes', 'string', 'max:150'],
            'settings.general.tagline' => ['sometimes', 'nullable', 'string', 'max:255'],
            'settings.general.default_currency' => ['sometimes', 'string', 'max:10'],
            'settings.general.default_locale' => ['sometimes', 'string', 'max:10'],
            'settings.general.timezone' => ['sometimes', 'string', 'max:64'],
            'settings.general.maintenance_mode' => ['sometimes', 'boolean'],

            'settings.contact' => ['sometimes', 'array'],
            'settings.contact.support_email' => ['sometimes', 'nullable', 'email', 'max:150'],
            'settings.contact.support_phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'settings.contact.business_address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'settings.contact.business_hours' => ['sometimes', 'nullable', 'string', 'max:255'],

            'settings.commerce' => ['sometimes', 'array'],
            'settings.commerce.min_order_amount' => ['sometimes', 'numeric', 'min:0'],
            'settings.commerce.free_shipping_threshold' => ['sometimes', 'numeric', 'min:0'],
            'settings.commerce.tax_rate_percent' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'settings.commerce.cod_enabled' => ['sometimes', 'boolean'],
            'settings.commerce.card_enabled' => ['sometimes', 'boolean'],
            'settings.commerce.wallet_enabled' => ['sometimes', 'boolean'],

            'settings.notifications' => ['sometimes', 'array'],
            'settings.notifications.email_notifications_enabled' => ['sometimes', 'boolean'],
            'settings.notifications.push_notifications_enabled' => ['sometimes', 'boolean'],
            'settings.notifications.order_status_email' => ['sometimes', 'boolean'],
            'settings.notifications.order_status_push' => ['sometimes', 'boolean'],
            'settings.notifications.marketing_email' => ['sometimes', 'boolean'],

            'settings.social' => ['sometimes', 'array'],
            'settings.social.facebook_url' => ['sometimes', 'nullable', 'url', 'max:500'],
            'settings.social.instagram_url' => ['sometimes', 'nullable', 'url', 'max:500'],
            'settings.social.twitter_url' => ['sometimes', 'nullable', 'url', 'max:500'],
            'settings.social.youtube_url' => ['sometimes', 'nullable', 'url', 'max:500'],
            'settings.social.whatsapp_url' => ['sometimes', 'nullable', 'url', 'max:500'],

            'settings.seo' => ['sometimes', 'array'],
            'settings.seo.meta_title' => ['sometimes', 'nullable', 'string', 'max:200'],
            'settings.seo.meta_description' => ['sometimes', 'nullable', 'string', 'max:500'],
            'settings.seo.meta_keywords' => ['sometimes', 'nullable', 'string', 'max:500'],

            'settings.theme' => ['sometimes', 'array'],
            'settings.theme.primary_color' => ['sometimes', 'string', 'regex:/^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'settings.theme.secondary_color' => ['sometimes', 'string', 'regex:/^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'settings.theme.button_color' => ['sometimes', 'string', 'regex:/^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'settings.theme.text_color' => ['sometimes', 'string', 'regex:/^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'settings.theme.background_color' => ['sometimes', 'string', 'regex:/^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'settings.theme.header_footer_color' => ['sometimes', 'string', 'regex:/^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'settings.theme.status_bar_color' => ['sometimes', 'string', 'regex:/^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'settings.theme.error_color' => ['sometimes', 'string', 'regex:/^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'settings.theme.success_color' => ['sometimes', 'string', 'regex:/^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'settings.theme.dark_mode_enabled' => ['sometimes', 'boolean'],
            'settings.theme.font_family' => ['sometimes', 'nullable', 'string', 'max:100'],
            'settings.theme.gradient_enabled' => ['sometimes', 'boolean'],
        ];
    }
}
