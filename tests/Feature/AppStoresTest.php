<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;

it('lists active stores for app', function () {
    $user = User::factory()->create();
    $store = Store::create([
        'owner_id' => $user->id,
        'name' => 'Test Store A',
        'slug' => 'test-store-a',
        'status' => 'active',
        'products_count' => 10,
        'rating_avg' => 4.5,
    ]);

    $category = Category::create([
        'name' => 'Store Category',
        'slug' => 'store-category',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Published Product',
        'slug' => 'published-product',
        'sku' => 'STORE-PRODUCT-1',
        'price' => 100,
        'is_published' => true,
    ]);

    Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Draft Product',
        'slug' => 'draft-product',
        'sku' => 'STORE-PRODUCT-2',
        'price' => 50,
        'is_published' => false,
    ]);

    $res = $this->get('/api/app/stores');
    $res->assertOk();
    expect($res->json('success'))->toBeTrue();
    $items = $res->json('data.items');
    expect($items)->toBeArray()->and(count($items))->toBeGreaterThan(0);
    expect($items[0])->toHaveKeys(['id', 'name', 'slug', 'logo', 'banner', 'rating_avg', 'products_count']);
    expect($items[0]['products_count'])->toBe(1);
});

it('shows a single active store', function () {
    $user = User::factory()->create();
    $store = Store::create([
        'owner_id' => $user->id,
        'name' => 'Test Store B',
        'slug' => 'test-store-b',
        'status' => 'active',
    ]);

    $category = Category::create([
        'name' => 'Show Category',
        'slug' => 'show-category',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Visible Product',
        'slug' => 'visible-product',
        'sku' => 'STORE-PRODUCT-3',
        'price' => 75,
        'is_published' => true,
    ]);

    $res = $this->get('/api/app/stores/'.$store->id);
    $res->assertOk();
    expect($res->json('success'))->toBeTrue();
    expect($res->json('data'))->toHaveKeys(['id', 'name', 'slug', 'logo', 'banner', 'rating_avg', 'products_count', 'followers_count', 'description']);
    expect($res->json('data.products_count'))->toBe(1);
});
