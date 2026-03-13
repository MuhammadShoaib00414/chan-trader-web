<?php

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\Store;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Spatie\Permission\Models\Role;

it('allows admin to create, update, and delete a promotion', function () {
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

    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'brand_id' => $brand->id,
        'name' => 'Test Product',
        'slug' => 'test-product',
        'sku' => 'SKU-TEST-0001',
        'price' => 10.50,
        'is_published' => true,
        'published_at' => now(),
    ]);

    $create = $this->post('/api/admin/promotions', [
        'product_id' => $product->id,
        'image' => 'promo.png',
        'is_active' => true,
    ]);
    $create->assertCreated();
    expect($create->json('success'))->toBeTrue();
    $promotionId = (int) $create->json('data.id');

    $update = $this->patch("/api/admin/promotions/{$promotionId}", [
        'is_active' => false,
    ]);
    $update->assertOk();
    expect($update->json('success'))->toBeTrue();
    expect(Promotion::find($promotionId)?->is_active)->toBeFalse();

    $delete = $this->delete("/api/admin/promotions/{$promotionId}");
    $delete->assertOk();
    expect($delete->json('success'))->toBeTrue();
    expect(Promotion::find($promotionId))->toBeNull();
});

