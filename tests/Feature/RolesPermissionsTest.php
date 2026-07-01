<?php

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Spatie\Permission\Models\Role;

it('restricts access to roles page without permission', function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $user = User::factory()->create();

    $this->actingAs($user);

    $response = $this->get('/roles');
    $response->assertStatus(403);
});

it('allows access to roles page for authorized users', function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $user = User::factory()->create();
    $user->assignRole(Role::findByName('super-admin'));

    $this->actingAs($user);

    $response = $this->get('/roles');
    $response->assertOk();
});

it('prevents creating users without permission', function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->post('/api/users', [
        'first_name' => 'Jane',
        'last_name' => 'Doe',
        'email' => 'jane@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertStatus(403);
});

it('allows creating users with permission', function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));

    $this->actingAs($admin);

    $response = $this->post('/api/users', [
        'first_name' => 'John',
        'last_name' => 'Smith',
        'email' => 'john@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'roles' => ['user'],
        'status' => true,
    ]);

    $response->assertCreated();
    $response->assertJsonPath('success', true);
});

it('allows viewing permissions via api when authorized', function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));

    $this->actingAs($admin);

    $response = $this->get('/api/permissions');
    $response->assertOk();
    $response->assertJsonPath('success', true);
});

it('allows admin to update role permissions', function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));

    $vendorRole = Role::findByName('vendor');

    $this->actingAs($admin);

    $response = $this->put("/api/roles/{$vendorRole->id}", [
        'name' => 'vendor',
        'permissions' => ['view orders', 'edit orders'],
    ]);

    $response->assertOk();
    $response->assertJsonPath('success', true);

    expect($vendorRole->fresh()->hasPermissionTo('view orders'))->toBeTrue();
    expect($vendorRole->fresh()->hasPermissionTo('orders.view'))->toBeTrue();
    expect($vendorRole->fresh()->hasPermissionTo('edit orders'))->toBeTrue();
    expect($vendorRole->fresh()->hasPermissionTo('orders.update'))->toBeTrue();
});
