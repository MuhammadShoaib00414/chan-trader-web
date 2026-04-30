<?php

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use App\Models\Subcategory;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

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
        'article' => 'Article 12',
        'deal_name' => 'Eid Offer',
        'limited_discount_text' => '2 days',
        'slug' => 'test-product',
        'sku' => 'SKU-TEST-0001',
        'price' => 10.50,
        'feature_image' => UploadedFile::fake()->image('feature.jpg'),
    ];

    $res = $this->post('/api/admin/products', $payload);
    $res->assertCreated();
    expect($res->json('success'))->toBeTrue();

    $id = (int) $res->json('data.id');
    expect(Product::find($id))->not->toBeNull();
    expect(Product::find($id)?->store_id)->toBe($store->id);
    expect(Product::find($id)?->feature_image)->toContain('/storage/products/feature/');
    expect(Product::find($id)?->article)->toBe('Article 12');
    expect(Product::find($id)?->deal_name)->toBe('Eid Offer');
    expect(Product::find($id)?->limited_discount_text)->toBe('2 days');
});

it('rejects creating a product with a subcategory from another category', function () {
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

    $primaryCategory = Category::create([
        'name' => 'Primary Category',
        'slug' => 'primary-category',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $otherCategory = Category::create([
        'name' => 'Other Category',
        'slug' => 'other-category',
        'is_active' => true,
        'sort_order' => 2,
    ]);

    $subcategory = Subcategory::create([
        'category_id' => $otherCategory->id,
        'name' => 'Other Subcategory',
        'slug' => 'other-subcategory',
        'is_active' => true,
    ]);

    $res = $this->post('/api/admin/products', [
        'store_id' => $store->id,
        'category_id' => $primaryCategory->id,
        'subcategory_id' => $subcategory->id,
        'name' => 'Invalid Product',
        'slug' => 'invalid-product',
        'sku' => 'SKU-TEST-0002',
        'price' => 10.50,
    ]);

    $res->assertStatus(422)->assertJsonValidationErrors(['subcategory_id']);
    expect(Product::where('slug', 'invalid-product')->exists())->toBeFalse();
});

it('clears a mismatched subcategory when the category changes', function () {
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

    $originalCategory = Category::create([
        'name' => 'Original Category',
        'slug' => 'original-category',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $newCategory = Category::create([
        'name' => 'New Category',
        'slug' => 'new-category',
        'is_active' => true,
        'sort_order' => 2,
    ]);

    $subcategory = Subcategory::create([
        'category_id' => $originalCategory->id,
        'name' => 'Original Subcategory',
        'slug' => 'original-subcategory',
        'is_active' => true,
    ]);

    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => $originalCategory->id,
        'subcategory_id' => $subcategory->id,
        'name' => 'Existing Product',
        'slug' => 'existing-product',
        'sku' => 'SKU-TEST-0003',
        'price' => 10.50,
    ]);

    $res = $this->patch("/api/admin/products/{$product->id}", [
        'category_id' => $newCategory->id,
    ]);

    $res->assertOk();
    expect($product->fresh()?->category_id)->toBe($newCategory->id);
    expect($product->fresh()?->subcategory_id)->toBeNull();
});

it('normalizes a lower compare_at value into a discount price when creating a product', function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));
    $this->actingAs($admin);

    $store = Store::create([
        'owner_id' => $admin->id,
        'name' => 'Discount Store',
        'slug' => 'discount-store',
        'status' => 'active',
    ]);

    $category = Category::create([
        'name' => 'Discount Category',
        'slug' => 'discount-category',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $res = $this->post('/api/admin/products', [
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Discount Product',
        'slug' => 'discount-product',
        'sku' => 'SKU-DISCOUNT-0001',
        'price' => 100,
        'compare_at' => 80,
    ]);

    $res->assertCreated();

    $product = Product::where('slug', 'discount-product')->firstOrFail();

    expect($product->price)->toBe(100.0);
    expect($product->compare_at)->toBeNull();
    expect($product->discounted_price)->toBe(80.0);
    expect($product->discount_percent)->toBe(20);
});

it('normalizes an original price with discount percent into the final discounted price', function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));
    $this->actingAs($admin);

    $store = Store::create([
        'owner_id' => $admin->id,
        'name' => 'Percent Discount Store',
        'slug' => 'percent-discount-store',
        'status' => 'active',
    ]);

    $category = Category::create([
        'name' => 'Percent Discount Category',
        'slug' => 'percent-discount-category',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $res = $this->post('/api/admin/products', [
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Ten Percent Product',
        'slug' => 'ten-percent-product',
        'sku' => 'SKU-DISCOUNT-0010',
        'price' => 100,
        'discount_percent' => 10,
    ]);

    $res->assertCreated();

    $product = Product::where('slug', 'ten-percent-product')->firstOrFail();

    expect($product->price)->toBe(100.0);
    expect($product->compare_at)->toBeNull();
    expect($product->discounted_price)->toBe(90.0);
    expect($product->discount_percent)->toBe(10);
});
