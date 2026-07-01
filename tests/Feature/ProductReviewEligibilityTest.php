<?php

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

function makeProductForReviewTests(): array
{
    $vendor = User::factory()->create();
    $vendor->assignRole(Role::findByName('vendor'));

    $store = Store::create([
        'owner_id' => $vendor->id,
        'name' => 'Review Store',
        'slug' => 'review-store-'.Str::random(4),
        'status' => 'active',
    ]);
    $category = Category::create([
        'name' => 'Review Category',
        'slug' => 'review-category-'.Str::random(4),
        'is_active' => true,
        'sort_order' => 1,
    ]);
    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Reviewable Product',
        'slug' => 'reviewable-product-'.Str::random(4),
        'sku' => 'RV-1',
        'price' => 999,
        'stock' => 10,
        'rating_avg' => 0,
        'rating_count' => 0,
    ]);

    return [$store, $product];
}

it('allows review when customer purchased and received product', function () {
    [$store, $product] = makeProductForReviewTests();
    $customer = User::factory()->create();

    $order = Order::create([
        'user_id' => $customer->id,
        'code' => 'ORD-DEL-001',
        'status' => 'delivered',
        'currency' => 'PKR',
        'subtotal' => 999,
        'grand_total' => 999,
        'payment_status' => 'paid',
    ]);
    OrderItem::create([
        'order_id' => $order->id,
        'store_id' => $store->id,
        'product_id' => $product->id,
        'name' => $product->name,
        'sku' => $product->sku,
        'quantity' => 1,
        'unit_price' => 999,
        'subtotal' => 999,
        'status' => 'delivered',
    ]);

    $this->actingAs($customer, 'api');
    $this->postJson("/api/milestone2/products/{$product->id}/reviews", [
        'rating' => 5,
        'comment' => 'Excellent product',
    ])->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.rating', 5);

    $product->refresh();
    expect((int) $product->rating_count)->toBe(1)
        ->and((float) $product->rating_avg)->toBe(5.0);
});

it('blocks review when user never purchased product', function () {
    [, $product] = makeProductForReviewTests();
    $customer = User::factory()->create();

    $this->actingAs($customer, 'api');
    $this->postJson("/api/milestone2/products/{$product->id}/reviews", [
        'rating' => 4,
        'comment' => 'Should fail',
    ])->assertStatus(403)
        ->assertJsonPath('success', false);
});

it('blocks review until order is delivered', function () {
    [$store, $product] = makeProductForReviewTests();
    $customer = User::factory()->create();

    $order = Order::create([
        'user_id' => $customer->id,
        'code' => 'ORD-PEN-001',
        'status' => 'pending',
        'currency' => 'PKR',
        'subtotal' => 999,
        'grand_total' => 999,
        'payment_status' => 'paid',
    ]);
    OrderItem::create([
        'order_id' => $order->id,
        'store_id' => $store->id,
        'product_id' => $product->id,
        'name' => $product->name,
        'sku' => $product->sku,
        'quantity' => 1,
        'unit_price' => 999,
        'subtotal' => 999,
        'status' => 'pending',
    ]);

    $this->actingAs($customer, 'api');
    $this->postJson("/api/milestone2/products/{$product->id}/reviews", [
        'rating' => 4,
        'comment' => 'Should fail',
    ])->assertStatus(403)
        ->assertJsonPath('success', false);
});
