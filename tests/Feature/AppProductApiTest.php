<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;

it('returns discounted price data in products and home responses', function () {
    $user = User::factory()->create();

    $store = Store::create([
        'owner_id' => $user->id,
        'name' => 'Catalog Store',
        'slug' => 'catalog-store',
        'status' => 'active',
        'rating_avg' => 4.5,
    ]);

    $category = Category::create([
        'name' => 'Catalog Category',
        'slug' => 'catalog-category',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Discounted Product',
        'slug' => 'discounted-product',
        'sku' => 'CATALOG-1',
        'price' => 80,
        'compare_at' => 100,
        'stock' => 5,
        'is_published' => true,
        'is_featured' => true,
        'is_top_selling' => true,
    ]);

    $productsResponse = $this->get('/api/app/products');

    $productsResponse->assertOk();
    expect($productsResponse->json('success'))->toBeTrue();
    expect($productsResponse->json('data.items.0'))->toHaveKeys([
        'id',
        'name',
        'slug',
        'sku',
        'price',
        'compare_at',
        'discountedPrice',
        'discount_percent',
        'store',
        'category',
    ]);
    expect((float) $productsResponse->json('data.items.0.discountedPrice'))->toBe(80.0);
    expect($productsResponse->json('data.items.0.discount_percent'))->toBe(20);

    $homeResponse = $this->get('/api/app/home');

    $homeResponse->assertOk();
    expect($homeResponse->json('success'))->toBeTrue();
    expect($homeResponse->json('data.featured_products.0'))->toHaveKeys([
        'id',
        'name',
        'slug',
        'sku',
        'price',
        'compare_at',
        'discountedPrice',
        'discount_percent',
        'store',
        'category',
    ]);
    expect((float) $homeResponse->json('data.featured_products.0.discountedPrice'))->toBe(80.0);
    expect((float) $homeResponse->json('data.top_selling.0.discountedPrice'))->toBe(80.0);
});
