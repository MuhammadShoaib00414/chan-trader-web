<?php

use App\Enums\ContentPageSlug;
use App\Models\ContentPage;
use App\Models\User;
use Database\Seeders\ContentPageSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(ContentPageSeeder::class);
});

it('updates content page from admin api', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));
    $admin->givePermissionTo('pages.manage');
    $this->actingAs($admin);

    $slug = ContentPageSlug::AboutUs->value;

    $this->patchJson("/api/admin/content-pages/{$slug}", [
        'title' => 'About Our Company',
        'content' => '<p>We sell great products.</p>',
        'is_published' => true,
    ])
        ->assertOk()
        ->assertJsonPath('data.title', 'About Our Company');

    expect(ContentPage::findBySlug($slug)?->content)->toContain('great products');
});

it('exposes published content pages on public app api', function () {
    ContentPage::query()->where('slug', ContentPageSlug::Faq->value)->update([
        'is_published' => true,
        'title' => 'FAQ',
        'content' => '<p>Question one?</p>',
    ]);

    $this->getJson('/api/app/content-pages/'.ContentPageSlug::Faq->value)
        ->assertSuccessful()
        ->assertJsonPath('data.title', 'FAQ')
        ->assertJsonPath('data.content', '<p>Question one?</p>');
});
