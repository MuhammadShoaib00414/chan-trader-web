<?php

use App\Models\Category;
use App\Models\Subcategory;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

it('allows admin to create, update, and delete a subcategory', function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));
    $this->actingAs($admin);

    $category = Category::create([
        'name' => 'Test Category',
        'slug' => 'test-category',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $create = $this->post('/api/admin/subcategories', [
        'category_id' => $category->id,
        'name' => 'Test Subcategory',
        'slug' => 'test-subcategory',
        'image' => UploadedFile::fake()->image('sub.png'),
        'is_active' => true,
        'sort_order' => 5,
    ]);
    $create->assertCreated();
    expect($create->json('success'))->toBeTrue();

    $subcategoryId = (int) $create->json('data.id');

    $update = $this->patch("/api/admin/subcategories/{$subcategoryId}", [
        'name' => 'Updated Subcategory',
        'slug' => 'updated-subcategory',
        'is_active' => false,
    ]);
    $update->assertOk();
    expect($update->json('success'))->toBeTrue();

    $subcategory = Subcategory::find($subcategoryId);
    expect($subcategory)->not->toBeNull();
    expect($subcategory?->name)->toBe('Updated Subcategory');
    expect($subcategory?->is_active)->toBeFalse();

    $delete = $this->delete("/api/admin/subcategories/{$subcategoryId}");
    $delete->assertOk();
    expect($delete->json('success'))->toBeTrue();
    expect(Subcategory::withTrashed()->find($subcategoryId))->not->toBeNull();
    expect(Subcategory::find($subcategoryId))->toBeNull();
});
