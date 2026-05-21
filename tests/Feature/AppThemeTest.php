<?php

use App\Models\Setting;
use App\Models\User;
use App\Services\Theme\AppThemeService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    Cache::flush();
});

it('returns structured theme payload on public app api', function () {
    $response = $this->getJson('/api/app/theme');

    $response->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonStructure([
            'data' => [
                'version',
                'colors' => [
                    'primary',
                    'secondary',
                    'button',
                    'text',
                    'background',
                    'headerFooter',
                    'statusBar',
                    'error',
                    'success',
                ],
                'options' => [
                    'darkModeEnabled',
                    'fontFamily',
                    'gradientEnabled',
                ],
                'updated_at',
            ],
        ])
        ->assertHeader('ETag')
        ->assertHeader('Cache-Control');
});

it('returns 304 when etag matches on public theme api', function () {
    $first = $this->getJson('/api/app/theme');
    $etag = $first->headers->get('ETag');

    $this->getJson('/api/app/theme', ['If-None-Match' => $etag])
        ->assertStatus(304);
});

it('updates theme colors from admin api in hex format', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));

    $this->actingAs($admin);

    $this->patchJson('/api/admin/settings/theme', [
        'colors' => [
            'primary_color' => '#112233',
            'secondary_color' => '#445566',
            'button_color' => '#112233',
            'text_color' => '#000000',
            'background_color' => '#FFFFFF',
            'header_footer_color' => '#EEEEEE',
            'status_bar_color' => '#FFFFFF',
            'error_color' => '#FF0000',
            'success_color' => '#00AA00',
        ],
    ])
        ->assertOk()
        ->assertJsonPath('data.mobile.colors.primary', '#112233');

    expect(Setting::getGroup('theme')['primary_color'])->toBe('#112233');
});

it('previews theme without persisting', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));
    $this->actingAs($admin);

    $this->postJson('/api/admin/settings/theme/preview', [
        'colors' => [
            'primary_color' => '#ABCDEF',
            'secondary_color' => '#64748B',
            'button_color' => '#2563EB',
            'text_color' => '#0F172A',
            'background_color' => '#FFFFFF',
            'header_footer_color' => '#F8FAFC',
            'status_bar_color' => '#FFFFFF',
            'error_color' => '#DC2626',
            'success_color' => '#16A34A',
        ],
    ])
        ->assertOk()
        ->assertJsonPath('data.colors.primary', '#ABCDEF');

    expect(Setting::getGroup('theme')['primary_color'])->toBe('#2563EB');
});

it('rejects invalid hex colors', function () {
    $service = app(AppThemeService::class);

    expect(fn () => $service->normalizeHex('not-a-color'))
        ->toThrow(InvalidArgumentException::class);
});

it('caches theme payload until updated', function () {
    $service = app(AppThemeService::class);

    $first = $service->cachedPayload();
    Setting::setGroup('theme', ['primary_color' => '#111111']);
    $second = $service->cachedPayload();

    expect($second['colors']['primary'])->toBe($first['colors']['primary']);

    $service->clearCache();
    $third = $service->cachedPayload();

    expect($third['colors']['primary'])->toBe('#111111');
});
