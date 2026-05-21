<?php

use App\Models\Setting;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('returns and updates settings for authorized admin', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));
    $admin->givePermissionTo('view settings', 'edit settings');
    $this->actingAs($admin);

    $this->getJson('/api/admin/settings')
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.general.app_display_name', 'TraderApp');

    $this->patchJson('/api/admin/settings', [
        'settings' => [
            'general' => [
                'app_display_name' => 'My Shop',
                'tagline' => 'Best deals',
            ],
        ],
    ])
        ->assertOk()
        ->assertJsonPath('data.general.app_display_name', 'My Shop');

    expect(Setting::getGroup('general')['app_display_name'])->toBe('My Shop');
});
