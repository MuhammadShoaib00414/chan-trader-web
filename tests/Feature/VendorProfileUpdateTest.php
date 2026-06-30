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

it('lets a vendor update profile text fields including shop details', function () {
    $vendor = User::factory()->create([
        'shop_name' => 'Old Shop',
        'city_district' => 'Lahore',
        'address' => 'Old address',
    ]);
    $vendor->assignRole(Role::findByName('vendor'));

    Store::create([
        'owner_id' => $vendor->id,
        'name' => 'Old Shop',
        'slug' => 'old-shop',
        'status' => 'active',
    ]);

    $this->actingAs($vendor, 'api');

    $this->postJson('/api/user/update-profile', [
        'first_name' => 'Sara',
        'last_name' => 'Vendor',
        'email' => $vendor->email,
        'shop_name' => 'Sara Industrial Parts',
        'city_district' => 'Karachi',
        'address' => 'Plot 12 Industrial Area',
    ])->assertSuccessful()
        ->assertJsonPath('success', true);

    $vendor->refresh();
    expect($vendor->shop_name)->toBe('Sara Industrial Parts')
        ->and($vendor->city_district)->toBe('Karachi')
        ->and($vendor->address)->toBe('Plot 12 Industrial Area');

    $store = Store::where('owner_id', $vendor->id)->first();
    expect($store->name)->toBe('Sara Industrial Parts')
        ->and($store->city)->toBe('Karachi');
});

it('lets a vendor upload store logo and banner via update-store-profile', function () {
    $vendor = User::factory()->create();
    $vendor->assignRole(Role::findByName('vendor'));

    $store = Store::create([
        'owner_id' => $vendor->id,
        'name' => 'Vendor Store',
        'slug' => 'vendor-store',
        'status' => 'active',
    ]);

    $this->actingAs($vendor, 'api');

    $logo = UploadedFile::fake()->image('logo.jpg', 400, 400);
    $banner = UploadedFile::fake()->image('banner.jpg', 1200, 400);

    $this->post('/api/user/update-store-profile', ['logo' => $logo])
        ->assertSuccessful();

    $this->post('/api/user/update-store-profile', ['banner' => $banner])
        ->assertSuccessful();

    $store->refresh();
    expect($store->logo)->not->toBeNull()
        ->and($store->banner)->not->toBeNull();
});

it('returns the authenticated vendor store via my-store', function () {
    $vendor = User::factory()->create();
    $vendor->assignRole(Role::findByName('vendor'));

    $store = Store::create([
        'owner_id' => $vendor->id,
        'name' => 'My Store',
        'slug' => 'my-store',
        'status' => 'active',
    ]);

    $this->actingAs($vendor, 'api');

    $this->getJson('/api/user/my-store')
        ->assertSuccessful()
        ->assertJsonPath('data.id', $store->id)
        ->assertJsonPath('data.name', 'My Store');
});
