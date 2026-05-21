<?php

return [
    'cache_key' => 'app.theme.payload',
    'cache_ttl' => 3600,

    'color_keys' => [
        'primary_color' => [
            'label' => 'Primary Color',
            'api_key' => 'primary',
            'default' => '#2563EB',
        ],
        'secondary_color' => [
            'label' => 'Secondary Color',
            'api_key' => 'secondary',
            'default' => '#64748B',
        ],
        'button_color' => [
            'label' => 'Button Color',
            'api_key' => 'button',
            'default' => '#2563EB',
        ],
        'text_color' => [
            'label' => 'Text Color',
            'api_key' => 'text',
            'default' => '#0F172A',
        ],
        'background_color' => [
            'label' => 'Background Color',
            'api_key' => 'background',
            'default' => '#FFFFFF',
        ],
        'header_footer_color' => [
            'label' => 'Header/Footer Color',
            'api_key' => 'headerFooter',
            'default' => '#F8FAFC',
        ],
        'status_bar_color' => [
            'label' => 'Status Bar Color',
            'api_key' => 'statusBar',
            'default' => '#FFFFFF',
        ],
        'error_color' => [
            'label' => 'Error Color',
            'api_key' => 'error',
            'default' => '#DC2626',
        ],
        'success_color' => [
            'label' => 'Success Color',
            'api_key' => 'success',
            'default' => '#16A34A',
        ],
    ],

    'future_options' => [
        'dark_mode_enabled' => false,
        'font_family' => null,
        'gradient_enabled' => false,
    ],
];
