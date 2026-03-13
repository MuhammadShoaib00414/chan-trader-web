<?php

use App\Models\Category;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

it('blocks category management without permission', function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->post('/api/admin/categories', ['name' => 'Caps', 'slug' => 'caps']);
    $response->assertStatus(403);
});

it('creates, updates and soft deletes categories for admin', function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));
    $this->actingAs($admin);

    $create = $this->post('/api/admin/categories', ['name' => 'Resistors', 'slug' => 'resistors']);
    $create->assertCreated();
    expect($create->json('success'))->toBeTrue();
    $id = (int) $create->json('data.id');

    $index = $this->get('/api/admin/categories');
    $index->assertOk();
    expect($index->json('success'))->toBeTrue();

    $show = $this->get("/api/admin/categories/{$id}");
    $show->assertOk();
    expect($show->json('data.id'))->toBe($id);

    $update = $this->patch("/api/admin/categories/{$id}", ['sort_order' => 5, 'is_active' => false]);
    $update->assertOk();
    expect($update->json('success'))->toBeTrue();
    expect(Category::find($id)?->sort_order)->toBe(5);
    expect(Category::find($id)?->is_active)->toBeFalse();

    $delete = $this->delete("/api/admin/categories/{$id}");
    $delete->assertOk();
    expect($delete->json('success'))->toBeTrue();

    $trashed = Category::withTrashed()->find($id);
    expect($trashed)->not->toBeNull();
    expect($trashed->trashed())->toBeTrue();
});

it('validates category creation inputs', function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));
    $this->actingAs($admin);

    $missingSlug = $this->post('/api/admin/categories', ['name' => 'Capacitors']);
    $missingSlug->assertStatus(422);
    expect($missingSlug->json('errors.slug.0'))->toBeString();

    $missingName = $this->post('/api/admin/categories', ['slug' => 'capacitors']);
    $missingName->assertStatus(422);
    expect($missingName->json('errors.name.0'))->toBeString();
});

it('enforces unique slug on category create', function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));
    $this->actingAs($admin);

    $first = $this->post('/api/admin/categories', ['name' => 'Resistors', 'slug' => 'resistors']);
    $first->assertCreated();

    $dup = $this->post('/api/admin/categories', ['name' => 'Resistors 2', 'slug' => 'resistors']);
    $dup->assertStatus(422);
    expect($dup->json('errors.slug.0'))->toBeString();
});

it('allows updating category without tripping uniqueness on itself', function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));
    $this->actingAs($admin);

    $created = $this->post('/api/admin/categories', ['name' => 'Cat A', 'slug' => 'cat-a']);
    $created->assertCreated();
    $id = (int) $created->json('data.id');

    $update = $this->patch("/api/admin/categories/{$id}", ['slug' => 'cat-a']);
    $update->assertOk();
    expect($update->json('success'))->toBeTrue();
});

it('blocks updating category to an existing slug', function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));
    $this->actingAs($admin);

    $a = $this->post('/api/admin/categories', ['name' => 'Cat A', 'slug' => 'cat-a']);
    $a->assertCreated();
    $b = $this->post('/api/admin/categories', ['name' => 'Cat B', 'slug' => 'cat-b']);
    $b->assertCreated();

    $idB = (int) $b->json('data.id');
    $update = $this->patch("/api/admin/categories/{$idB}", ['slug' => 'cat-a']);
    $update->assertStatus(422);
    expect($update->json('errors.slug.0'))->toBeString();
});

it('uploads category image on update', function () {
    Storage::fake('public');

    $this->seed(RolesAndPermissionsSeeder::class);
    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));
    $this->actingAs($admin);

    $created = $this->post('/api/admin/categories', ['name' => 'Connectors', 'slug' => 'connectors']);
    $created->assertCreated();
    $id = (int) $created->json('data.id');

    $file = UploadedFile::fake()->image('cat.png', 200, 200);

    // Simulate frontend behavior: POST + _method=PATCH with multipart payload
    $update = $this->post("/api/admin/categories/{$id}", [
        '_method' => 'PATCH',
        'image' => $file,
    ]);
    $update->assertOk();
    expect($update->json('success'))->toBeTrue();

    $category = Category::find($id);
    expect($category)->not->toBeNull();
    expect($category->image)->toBeString();
    expect(Storage::disk('public')->exists($category->image))->toBeTrue();
});

