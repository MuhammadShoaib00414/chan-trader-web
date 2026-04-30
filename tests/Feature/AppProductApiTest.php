<?php

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;

it('returns original and discounted prices correctly in products and home responses', function () {
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

    $brand = Brand::create([
        'name' => 'Fuji',
        'slug' => 'fuji',
        'sort_order' => 1,
    ]);

    Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'brand_id' => $brand->id,
        'name' => 'Discounted Product',
        'article' => 'Article 12',
        'deal_name' => 'Eid Offer',
        'limited_discount_text' => '2 days',
        'slug' => 'discounted-product',
        'sku' => 'CATALOG-1',
        'price' => 100,
        'discount_percent' => 10,
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
        'article',
        'deal_name',
        'limited_discount_text',
        'slug',
        'sku',
        'price',
        'discountedPrice',
        'discount_percent',
        'brand_name',
        'store',
        'category',
    ]);
    expect($productsResponse->json('data.items.0.compare_at'))->toBeNull();
    expect($productsResponse->json('data.items.0.article'))->toBe('Article 12');
    expect($productsResponse->json('data.items.0.deal_name'))->toBe('Eid Offer');
    expect($productsResponse->json('data.items.0.limited_discount_text'))->toBe('2 days');
    expect($productsResponse->json('data.items.0.brand_name'))->toBe('Fuji');
    expect((float) $productsResponse->json('data.items.0.price'))->toBe(100.0);
    expect((float) $productsResponse->json('data.items.0.discountedPrice'))->toBe(90.0);
    expect($productsResponse->json('data.items.0.discount_percent'))->toBe(10);

    $homeResponse = $this->get('/api/app/home');

    $homeResponse->assertOk();
    expect($homeResponse->json('success'))->toBeTrue();
    expect($homeResponse->json('data.featured_products.0'))->toHaveKeys([
        'id',
        'name',
        'article',
        'deal_name',
        'limited_discount_text',
        'slug',
        'sku',
        'price',
        'discountedPrice',
        'discount_percent',
        'brand_name',
        'store',
        'category',
    ]);
    expect($homeResponse->json('data.featured_products.0.compare_at'))->toBeNull();
    expect($homeResponse->json('data.featured_products.0.article'))->toBe('Article 12');
    expect($homeResponse->json('data.featured_products.0.deal_name'))->toBe('Eid Offer');
    expect($homeResponse->json('data.featured_products.0.limited_discount_text'))->toBe('2 days');
    expect($homeResponse->json('data.featured_products.0.brand_name'))->toBe('Fuji');
    expect((float) $homeResponse->json('data.featured_products.0.price'))->toBe(100.0);
    expect((float) $homeResponse->json('data.featured_products.0.discountedPrice'))->toBe(90.0);
    expect((float) $homeResponse->json('data.top_selling.0.discountedPrice'))->toBe(90.0);
});

it('returns correct original and discounted prices in app and product detail apis', function () {
    $user = User::factory()->create();
    $this->actingAs($user, 'api');

    $store = Store::create([
        'owner_id' => $user->id,
        'name' => 'Pricing Store',
        'slug' => 'pricing-store',
        'status' => 'active',
        'rating_avg' => 4.7,
    ]);

    $category = Category::create([
        'name' => 'Pricing Category',
        'slug' => 'pricing-category',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $brand = Brand::create([
        'name' => 'Fuji',
        'slug' => 'fuji-pricing',
        'sort_order' => 1,
    ]);

    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'brand_id' => $brand->id,
        'name' => 'Pricing Product',
        'article' => 'Article 77',
        'deal_name' => 'Weekend Deal',
        'limited_discount_text' => 'Last days',
        'slug' => 'pricing-product',
        'sku' => 'PRICE-1',
        'price' => 100,
        'discount_percent' => 10,
        'stock' => 7,
        'is_published' => true,
    ]);

    $appDetailResponse = $this->get("/api/app/products/{$product->id}");
    $appDetailResponse->assertOk();
    expect((float) $appDetailResponse->json('data.price'))->toBe(100.0);
    expect($appDetailResponse->json('data.compare_at'))->toBeNull();
    expect($appDetailResponse->json('data.article'))->toBe('Article 77');
    expect($appDetailResponse->json('data.deal_name'))->toBe('Weekend Deal');
    expect($appDetailResponse->json('data.limited_discount_text'))->toBe('Last days');
    expect($appDetailResponse->json('data.brand_name'))->toBe('Fuji');
    expect((float) $appDetailResponse->json('data.discountedPrice'))->toBe(90.0);
    expect($appDetailResponse->json('data.discount_percent'))->toBe(10);

    $milestoneDetailResponse = $this->get("/api/milestone2/products/{$product->id}");
    $milestoneDetailResponse->assertOk();
    expect((float) $milestoneDetailResponse->json('data.price'))->toBe(100.0);
    expect($milestoneDetailResponse->json('data.compare_at'))->toBeNull();
    expect((float) $milestoneDetailResponse->json('data.discountedPrice'))->toBe(90.0);
    expect($milestoneDetailResponse->json('data.discount_percent'))->toBe(10);
});
