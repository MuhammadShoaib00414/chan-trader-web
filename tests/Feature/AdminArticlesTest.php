<?php

use App\Models\Article;
use App\Models\Category;
use App\Models\Subcategory;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

it('allows admin to create, update, and delete an article', function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));
    $this->actingAs($admin);

    $category = Category::create([
        'name' => 'Power',
        'slug' => 'power',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $subcategory = Subcategory::create([
        'category_id' => $category->id,
        'name' => 'IGBT',
        'slug' => 'igbt',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $create = $this->post('/api/admin/articles', [
        'subcategory_id' => $subcategory->id,
        'name' => 'Article 12',
        'slug' => 'article-12',
        'is_active' => true,
        'sort_order' => 5,
    ]);

    $create->assertCreated();
    expect($create->json('success'))->toBeTrue();

    $articleId = (int) $create->json('data.id');

    $update = $this->patch("/api/admin/articles/{$articleId}", [
        'name' => 'Updated Article',
        'slug' => 'updated-article',
        'is_active' => false,
    ]);

    $update->assertOk();
    expect($update->json('success'))->toBeTrue();

    $article = Article::find($articleId);
    expect($article)->not->toBeNull();
    expect($article?->name)->toBe('Updated Article');
    expect($article?->is_active)->toBeFalse();

    $delete = $this->delete("/api/admin/articles/{$articleId}");
    $delete->assertOk();
    expect($delete->json('success'))->toBeTrue();
    expect(Article::withTrashed()->find($articleId))->not->toBeNull();
    expect(Article::find($articleId))->toBeNull();
});

it('requires article slugs to be unique within the same subcategory', function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));
    $this->actingAs($admin);

    $category = Category::create([
        'name' => 'Industrial',
        'slug' => 'industrial',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $subcategory = Subcategory::create([
        'category_id' => $category->id,
        'name' => 'Modules',
        'slug' => 'modules',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    Article::create([
        'subcategory_id' => $subcategory->id,
        'name' => 'Article A',
        'slug' => 'duplicate-article',
        'is_active' => true,
    ]);

    $response = $this->post('/api/admin/articles', [
        'subcategory_id' => $subcategory->id,
        'name' => 'Article B',
        'slug' => 'duplicate-article',
    ]);

    $response->assertStatus(422)->assertJsonValidationErrors(['slug']);
});
