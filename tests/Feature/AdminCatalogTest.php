<?php

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Spatie\Permission\Models\Role;

it('blocks category management without permission', function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $user = User::factory()->create();
    $this->actingAs($user);
    $response = $this->post('/api/admin/categories', ['name' => 'Caps', 'slug' => 'caps']);
    $response->assertStatus(403);
});

it('allows category management for admin', function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));
    $this->actingAs($admin);

    $create = $this->post('/api/admin/categories', ['name' => 'Resistors', 'slug' => 'resistors']);
    $create->assertCreated();
    $id = $create->json('data.id');

    $index = $this->get('/api/admin/categories');
    $index->assertOk();

    $show = $this->get("/api/admin/categories/{$id}");
    $show->assertOk();

    $update = $this->patch("/api/admin/categories/{$id}", ['sort_order' => 2]);
    $update->assertOk();

    $delete = $this->delete("/api/admin/categories/{$id}");
    $delete->assertOk();
});

it('allows brand management for admin', function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));
    $this->actingAs($admin);

    $create = $this->post('/api/admin/brands', ['name' => 'Texas Instruments', 'slug' => 'texas-instruments']);
    $create->assertCreated();
    $id = $create->json('data.id');

    $index = $this->get('/api/admin/brands');
    $index->assertOk();

    $show = $this->get("/api/admin/brands/{$id}");
    $show->assertOk();

    $update = $this->patch("/api/admin/brands/{$id}", ['logo' => 'logo.png']);
    $update->assertOk();

    $delete = $this->delete("/api/admin/brands/{$id}");
    $delete->assertOk();
});
