<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use App\Models\WishlistItem;

it('returns only available wishlist items and removes stale ones', function () {
    $user = User::factory()->create();
    $this->actingAs($user, 'api');

    $store = Store::create([
        'owner_id' => $user->id,
        'name' => 'Wishlist Store',
        'slug' => 'wishlist-store',
        'status' => 'active',
    ]);

    $category = Category::create([
        'name' => 'Wishlist Category',
        'slug' => 'wishlist-category',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $publishedProduct = Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Published Wishlist Product',
        'slug' => 'published-wishlist-product',
        'sku' => 'WISHLIST-1',
        'price' => 100,
        'discount_percent' => 10,
        'stock' => 3,
        'is_published' => true,
    ]);

    $staleProduct = Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Stale Wishlist Product',
        'slug' => 'stale-wishlist-product',
        'sku' => 'WISHLIST-2',
        'price' => 40,
        'stock' => 0,
        'is_published' => true,
    ]);
    $staleProduct->delete();

    WishlistItem::create([
        'user_id' => $user->id,
        'product_id' => $publishedProduct->id,
    ]);

    $staleWishlistItem = WishlistItem::create([
        'user_id' => $user->id,
        'product_id' => $staleProduct->id,
    ]);

    $response = $this->get('/api/milestone2/wishlist');

    $response->assertOk();
    expect($response->json('success'))->toBeTrue();
    expect($response->json('data.items'))->toHaveCount(1);
    expect($response->json('data.items.0.product'))->toHaveKeys([
        'id',
        'name',
        'slug',
        'price',
        'discountedPrice',
        'discount_percent',
        'feature_image',
        'store',
    ]);
    expect((float) $response->json('data.items.0.product.discountedPrice'))->toBe(90.0);
    $this->assertDatabaseMissing('wishlist_items', ['id' => $staleWishlistItem->id]);
});

it('toggles wishlist items for published products', function () {
    $user = User::factory()->create();
    $this->actingAs($user, 'api');

    $store = Store::create([
        'owner_id' => $user->id,
        'name' => 'Toggle Store',
        'slug' => 'toggle-store',
        'status' => 'active',
    ]);

    $category = Category::create([
        'name' => 'Toggle Category',
        'slug' => 'toggle-category',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Toggle Product',
        'slug' => 'toggle-product',
        'sku' => 'WISHLIST-3',
        'price' => 55,
        'stock' => 10,
        'is_published' => true,
    ]);

    $addResponse = $this->postJson('/api/milestone2/wishlist/toggle', [
        'product_id' => $product->id,
    ]);

    $addResponse->assertOk();
    expect($addResponse->json('data.is_wishlisted'))->toBeTrue();
    $this->assertDatabaseHas('wishlist_items', [
        'user_id' => $user->id,
        'product_id' => $product->id,
    ]);

    $removeResponse = $this->postJson('/api/milestone2/wishlist/toggle', [
        'product_id' => $product->id,
    ]);

    $removeResponse->assertOk();
    expect($removeResponse->json('data.is_wishlisted'))->toBeFalse();
    $this->assertDatabaseMissing('wishlist_items', [
        'user_id' => $user->id,
        'product_id' => $product->id,
    ]);
});
