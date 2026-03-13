<?php

use App\Models\Brand;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Spatie\Permission\Models\Role;

it('blocks brand management without permission', function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->post('/api/admin/brands', ['name' => 'Acme', 'slug' => 'acme']);
    $response->assertStatus(403);
});

it('creates, updates and soft deletes brands for admin', function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));
    $this->actingAs($admin);

    $create = $this->post('/api/admin/brands', ['name' => 'Texas Instruments', 'slug' => 'texas-instruments']);
    $create->assertCreated();
    expect($create->json('success'))->toBeTrue();
    $id = (int) $create->json('data.id');

    $index = $this->get('/api/admin/brands');
    $index->assertOk();
    expect($index->json('success'))->toBeTrue();

    $show = $this->get("/api/admin/brands/{$id}");
    $show->assertOk();
    expect($show->json('data.id'))->toBe($id);

    $update = $this->patch("/api/admin/brands/{$id}", ['sort_order' => 7, 'logo' => 'logo.png']);
    $update->assertOk();
    expect($update->json('success'))->toBeTrue();
    expect(Brand::find($id)?->sort_order)->toBe(7);
    expect(Brand::find($id)?->logo)->toBe('logo.png');

    $delete = $this->delete("/api/admin/brands/{$id}");
    $delete->assertOk();
    expect($delete->json('success'))->toBeTrue();

    $trashed = Brand::withTrashed()->find($id);
    expect($trashed)->not->toBeNull();
    expect($trashed->trashed())->toBeTrue();
});

it('validates brand creation inputs and unique constraints', function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));
    $this->actingAs($admin);

    $missingSlug = $this->post('/api/admin/brands', ['name' => 'Capacitors Inc']);
    $missingSlug->assertStatus(422);
    expect($missingSlug->json('errors.slug.0'))->toBeString();

    $missingName = $this->post('/api/admin/brands', ['slug' => 'capacitors-inc']);
    $missingName->assertStatus(422);
    expect($missingName->json('errors.name.0'))->toBeString();

    $first = $this->post('/api/admin/brands', ['name' => 'Acme', 'slug' => 'acme']);
    $first->assertCreated();

    $dupSlug = $this->post('/api/admin/brands', ['name' => 'Acme 2', 'slug' => 'acme']);
    $dupSlug->assertStatus(422);
    expect($dupSlug->json('errors.slug.0'))->toBeString();

    $dupName = $this->post('/api/admin/brands', ['name' => 'Acme', 'slug' => 'acme-2']);
    $dupName->assertStatus(422);
    expect($dupName->json('errors.name.0'))->toBeString();
});

it('allows updating brand without tripping uniqueness on itself', function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));
    $this->actingAs($admin);

    $created = $this->post('/api/admin/brands', ['name' => 'Brand A', 'slug' => 'brand-a']);
    $created->assertCreated();
    $id = (int) $created->json('data.id');

    $update = $this->patch("/api/admin/brands/{$id}", ['name' => 'Brand A', 'slug' => 'brand-a']);
    $update->assertOk();
    expect($update->json('success'))->toBeTrue();
});

it('blocks updating brand to an existing slug', function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));
    $this->actingAs($admin);

    $a = $this->post('/api/admin/brands', ['name' => 'Brand A', 'slug' => 'brand-a']);
    $a->assertCreated();
    $b = $this->post('/api/admin/brands', ['name' => 'Brand B', 'slug' => 'brand-b']);
    $b->assertCreated();

    $idB = (int) $b->json('data.id');
    $update = $this->patch("/api/admin/brands/{$idB}", ['slug' => 'brand-a']);
    $update->assertStatus(422);
    expect($update->json('errors.slug.0'))->toBeString();
});

