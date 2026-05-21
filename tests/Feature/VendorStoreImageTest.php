<?php

use App\Models\Store;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    Storage::fake('public');
});

it('uploads store logo and banner when creating a vendor', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('super-admin'));
    $this->actingAs($admin);

    $logo = UploadedFile::fake()->image('logo.jpg', 800, 800);
    $banner = UploadedFile::fake()->image('banner.jpg', 1600, 600);

    $response = $this->post('/api/admin/vendors', [
        'first_name' => 'New',
        'last_name' => 'Vendor',
        'email' => 'newvendor@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'store_name' => 'Image Store',
        'logo' => $logo,
        'banner' => $banner,
    ]);

    $response->assertCreated();

    $store = Store::where('slug', 'image-store')->first();
    expect($store)->not->toBeNull()
        ->and($store->logo)->not->toBeNull()
        ->and($store->banner)->not->toBeNull();
});

it('updates store images when patching a vendor', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('super-admin'));
    $this->actingAs($admin);

    $vendor = User::factory()->create();
    $vendor->assignRole('vendor');

    $store = Store::create([
        'owner_id' => $vendor->id,
        'name' => 'Patch Store',
        'slug' => 'patch-store',
        'status' => 'active',
    ]);

    $logo = UploadedFile::fake()->image('new-logo.jpg');

    $this->post("/api/admin/vendors/{$vendor->id}", [
        '_method' => 'PATCH',
        'logo' => $logo,
    ])->assertOk();

    expect($store->fresh()->logo)->not->toBeNull();
});
