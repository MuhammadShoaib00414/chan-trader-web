<?php

use App\Models\Article;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use App\Models\Subcategory;
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

it('returns related products from the same subcategory only', function () {
    $user = User::factory()->create();
    $this->actingAs($user, 'api');

    $store = Store::create([
        'owner_id' => $user->id,
        'name' => 'Related Store',
        'slug' => 'related-store',
        'status' => 'active',
        'rating_avg' => 4.8,
    ]);

    $category = Category::create([
        'name' => 'Power Category',
        'slug' => 'power-category',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $mosfet = Subcategory::create([
        'category_id' => $category->id,
        'name' => 'MOSFET',
        'slug' => 'mosfet',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $igbt = Subcategory::create([
        'category_id' => $category->id,
        'name' => 'IGBT',
        'slug' => 'igbt',
        'is_active' => true,
        'sort_order' => 2,
    ]);

    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'subcategory_id' => $mosfet->id,
        'name' => 'Main MOSFET Product',
        'slug' => 'main-mosfet-product',
        'sku' => 'REL-001',
        'price' => 100,
        'stock' => 8,
        'is_published' => true,
    ]);

    $sameSubcategory = Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'subcategory_id' => $mosfet->id,
        'name' => 'Same Subcategory Product',
        'slug' => 'same-subcategory-product',
        'sku' => 'REL-002',
        'price' => 110,
        'stock' => 5,
        'is_published' => true,
    ]);

    Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'subcategory_id' => $igbt->id,
        'name' => 'Different Subcategory Product',
        'slug' => 'different-subcategory-product',
        'sku' => 'REL-003',
        'price' => 120,
        'stock' => 5,
        'is_published' => true,
    ]);

    $appDetailResponse = $this->get("/api/app/products/{$product->id}");
    $appDetailResponse->assertOk();
    expect($appDetailResponse->json('data.related_products'))->toHaveCount(1);
    expect($appDetailResponse->json('data.related_products.0.id'))->toBe($sameSubcategory->id);

    $milestoneDetailResponse = $this->get("/api/milestone2/products/{$product->id}");
    $milestoneDetailResponse->assertOk();
    expect($milestoneDetailResponse->json('data.related_products'))->toHaveCount(1);
    expect($milestoneDetailResponse->json('data.related_products.0.id'))->toBe($sameSubcategory->id);
});

it('returns active articles for the app with category and subcategory filters', function () {
    $category = Category::create([
        'name' => 'Power Components',
        'slug' => 'power-components',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $otherCategory = Category::create([
        'name' => 'Control Parts',
        'slug' => 'control-parts',
        'is_active' => true,
        'sort_order' => 2,
    ]);

    $subcategory = Subcategory::create([
        'category_id' => $category->id,
        'name' => 'MOSFET',
        'slug' => 'mosfet',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $otherSubcategory = Subcategory::create([
        'category_id' => $otherCategory->id,
        'name' => 'Sensors',
        'slug' => 'sensors',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    Article::create([
        'subcategory_id' => $subcategory->id,
        'name' => 'Article 101',
        'slug' => 'article-101',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    Article::create([
        'subcategory_id' => $subcategory->id,
        'name' => 'Article 102',
        'slug' => 'article-102',
        'sort_order' => 2,
        'is_active' => false,
    ]);

    Article::create([
        'subcategory_id' => $otherSubcategory->id,
        'name' => 'Sensor Article',
        'slug' => 'sensor-article',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    $response = $this->get("/api/app/articles?category_id={$category->id}&subcategory_id={$subcategory->id}&q=101");

    $response->assertOk();
    expect($response->json('success'))->toBeTrue();
    expect($response->json('message'))->toBe('Articles retrieved');
    expect($response->json('data.items'))->toHaveCount(1);
    expect($response->json('data.items.0'))->toHaveKeys([
        'id',
        'subcategory_id',
        'name',
        'slug',
        'sort_order',
        'is_active',
        'subcategory',
        'category',
    ]);
    expect($response->json('data.items.0.name'))->toBe('Article 101');
    expect($response->json('data.items.0.subcategory.name'))->toBe('MOSFET');
    expect($response->json('data.items.0.category.name'))->toBe('Power Components');
});

it('filters app products by article name and article id', function () {
    $user = User::factory()->create();

    $store = Store::create([
        'owner_id' => $user->id,
        'name' => 'Article Filter Store',
        'slug' => 'article-filter-store',
        'status' => 'active',
    ]);

    $category = Category::create([
        'name' => 'Article Filter Category',
        'slug' => 'article-filter-category',
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

    $article = Article::create([
        'subcategory_id' => $subcategory->id,
        'name' => 'Article 104',
        'slug' => 'article-104',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'subcategory_id' => $subcategory->id,
        'name' => 'Matching Product',
        'article' => 'Article 104',
        'slug' => 'matching-product',
        'sku' => 'ART-FILTER-001',
        'price' => 100,
        'stock' => 6,
        'is_published' => true,
    ]);

    Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'subcategory_id' => $subcategory->id,
        'name' => 'Non Matching Product',
        'article' => 'Article 999',
        'slug' => 'non-matching-product',
        'sku' => 'ART-FILTER-002',
        'price' => 100,
        'stock' => 6,
        'is_published' => true,
    ]);

    $byNameResponse = $this->get('/api/app/products?article=104');
    $byNameResponse->assertOk();
    expect($byNameResponse->json('data.items'))->toHaveCount(1);
    expect($byNameResponse->json('data.items.0.article'))->toBe('Article 104');

    $byIdResponse = $this->get("/api/app/products?article_id={$article->id}");
    $byIdResponse->assertOk();
    expect($byIdResponse->json('data.items'))->toHaveCount(1);
    expect($byIdResponse->json('data.items.0.article'))->toBe('Article 104');
});
