<?php

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Spatie\Permission\Models\Role;

it('allows admin to create a product', function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));
    $this->actingAs($admin);

    $store = Store::create([
        'owner_id' => $admin->id,
        'name' => 'Test Store',
        'slug' => 'test-store',
        'status' => 'active',
    ]);

    $category = Category::create([
        'name' => 'Test Category',
        'slug' => 'test-category',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $brand = Brand::create([
        'name' => 'Test Brand',
        'slug' => 'test-brand',
        'sort_order' => 1,
    ]);

    $payload = [
        'store_id' => $store->id,
        'category_id' => $category->id,
        'brand_id' => $brand->id,
        'name' => 'Test Product',
        'slug' => 'test-product',
        'sku' => 'SKU-TEST-0001',
        'price' => 10.50,
    ];

    $res = $this->post('/api/admin/products', $payload);
    $res->assertCreated();
    expect($res->json('success'))->toBeTrue();

    $id = (int) $res->json('data.id');
    expect(Product::find($id))->not->toBeNull();
    expect(Product::find($id)?->store_id)->toBe($store->id);
});

