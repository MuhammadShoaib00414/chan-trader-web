<?php

return [
    'defaults' => [
        'general' => [
            'app_display_name' => 'TraderApp',
            'tagline' => '',
            'default_currency' => 'PKR',
            'default_locale' => 'en',
            'timezone' => 'Asia/Karachi',
            'maintenance_mode' => false,
        ],
        'contact' => [
            'support_email' => '',
            'support_phone' => '',
            'business_address' => '',
            'business_hours' => '',
        ],
        'commerce' => [
            'min_order_amount' => 0,
            'free_shipping_threshold' => 0,
            'tax_rate_percent' => 0,
            'cod_enabled' => true,
            'card_enabled' => true,
            'wallet_enabled' => false,
        ],
        'notifications' => [
            'email_notifications_enabled' => true,
            'push_notifications_enabled' => true,
            'order_status_email' => true,
            'order_status_push' => true,
            'marketing_email' => false,
        ],
        'social' => [
            'facebook_url' => '',
            'instagram_url' => '',
            'twitter_url' => '',
            'youtube_url' => '',
            'whatsapp_url' => '',
        ],
        'seo' => [
            'meta_title' => '',
            'meta_description' => '',
            'meta_keywords' => '',
        ],
        'theme' => [
            'primary_color' => '#2563EB',
            'secondary_color' => '#64748B',
            'button_color' => '#2563EB',
            'text_color' => '#0F172A',
            'background_color' => '#FFFFFF',
            'header_footer_color' => '#F8FAFC',
            'status_bar_color' => '#FFFFFF',
            'error_color' => '#DC2626',
            'success_color' => '#16A34A',
            'dark_mode_enabled' => false,
            'font_family' => '',
            'gradient_enabled' => false,
        ],
    ],
];
