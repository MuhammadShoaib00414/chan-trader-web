<?php

use App\Models\User;
use Database\Seeders\ShopManagementUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('creates a restricted shop management user with only the intended module access', function () {
    $this->seed(ShopManagementUserSeeder::class);

    $user = User::where('email', 'shopuser@example.com')->firstOrFail();

    expect($user->hasRole('shop-user'))->toBeTrue();

    foreach ([
        'view shop dashboard',
        'view customers',
        'create customers',
        'edit customers',
        'delete customers',
        'view sales',
        'create sales',
        'edit sales',
        'delete sales',
        'view suppliers',
        'create suppliers',
        'edit suppliers',
        'delete suppliers',
        'view stock',
        'create stock',
        'edit stock',
        'delete stock',
    ] as $permission) {
        expect($user->hasPermissionTo($permission))->toBeTrue();
    }

    foreach ([
        'view dashboard',
        'view users',
        'view roles',
        'products.view',
        'categories.manage',
    ] as $permission) {
        expect($user->hasPermissionTo($permission))->toBeFalse();
    }
});

it('lets the seeded shop user reach only the requested modules', function () {
    $this->seed(ShopManagementUserSeeder::class);

    $user = User::where('email', 'shopuser@example.com')->firstOrFail();

    $this->actingAs($user);

    $this->get('/dashboard')->assertRedirect(route('shop.dashboard'));
    $this->get('/admin/shop/dashboard')->assertOk();
    $this->get('/admin/shop/customers')->assertOk();
    $this->get('/admin/shop/sales')->assertOk();
    $this->get('/admin/shop/stock')->assertOk();
    $this->get('/admin/suppliers')->assertOk();

    $this->get('/users')->assertStatus(403);
    $this->get('/roles')->assertStatus(403);
    $this->get('/admin/products')->assertStatus(403);
});

it('removes shop access from other users after seeding', function () {
    $otherUser = User::factory()->create([
        'email' => 'otherstaff@example.com',
    ]);

    $this->seed(ShopManagementUserSeeder::class);

    $otherUser->refresh();

    expect($otherUser->hasRole('shop-user'))->toBeFalse();

    foreach ([
        'view shop dashboard',
        'view customers',
        'view sales',
        'view suppliers',
        'view stock',
    ] as $permission) {
        expect($otherUser->hasPermissionTo($permission))->toBeFalse();
    }

    $admin = User::factory()->create([
        'email' => 'admin-no-shop@example.com',
    ]);
    $admin->assignRole('admin');

    $this->actingAs($admin);

    $this->get('/admin/shop/dashboard')->assertStatus(403);
    $this->get('/admin/shop/customers')->assertStatus(403);
    $this->get('/admin/shop/sales')->assertStatus(403);
    $this->get('/admin/shop/stock')->assertStatus(403);
    $this->get('/admin/suppliers')->assertStatus(403);
});
