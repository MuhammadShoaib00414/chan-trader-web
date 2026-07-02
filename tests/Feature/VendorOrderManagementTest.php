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

it('returns only vendor owned order items in vendor orders list', function () {
    $vendorA = User::factory()->create();
    $vendorA->assignRole(Role::findByName('vendor'));
    $vendorA->givePermissionTo(['orders.view', 'orders.update']);
    $vendorB = User::factory()->create();
    $vendorB->assignRole(Role::findByName('vendor'));
    $vendorB->givePermissionTo(['orders.view', 'orders.update']);
    $customer = User::factory()->create();

    $storeA = Store::create([
        'owner_id' => $vendorA->id,
        'name' => 'Store A',
        'slug' => 'store-a-'.Str::random(4),
        'status' => 'active',
    ]);
    $storeB = Store::create([
        'owner_id' => $vendorB->id,
        'name' => 'Store B',
        'slug' => 'store-b-'.Str::random(4),
        'status' => 'active',
    ]);
    $category = Category::create([
        'name' => 'Orders',
        'slug' => 'orders-'.Str::random(4),
        'is_active' => true,
        'sort_order' => 1,
    ]);
    $productA = Product::create([
        'store_id' => $storeA->id,
        'category_id' => $category->id,
        'name' => 'Product A',
        'slug' => 'product-a-'.Str::random(4),
        'sku' => 'A-1',
        'price' => 1000,
        'stock' => 5,
    ]);
    $productB = Product::create([
        'store_id' => $storeB->id,
        'category_id' => $category->id,
        'name' => 'Product B',
        'slug' => 'product-b-'.Str::random(4),
        'sku' => 'B-1',
        'price' => 500,
        'stock' => 5,
    ]);

    $mixedOrder = Order::create([
        'user_id' => $customer->id,
        'code' => 'ORD-MIX-001',
        'status' => 'pending',
        'currency' => 'PKR',
        'subtotal' => 1500,
        'grand_total' => 1500,
        'payment_status' => 'paid',
    ]);
    OrderItem::create([
        'order_id' => $mixedOrder->id,
        'store_id' => $storeA->id,
        'product_id' => $productA->id,
        'name' => $productA->name,
        'sku' => $productA->sku,
        'quantity' => 1,
        'unit_price' => 1000,
        'subtotal' => 1000,
        'status' => 'pending',
    ]);
    OrderItem::create([
        'order_id' => $mixedOrder->id,
        'store_id' => $storeB->id,
        'product_id' => $productB->id,
        'name' => $productB->name,
        'sku' => $productB->sku,
        'quantity' => 1,
        'unit_price' => 500,
        'subtotal' => 500,
        'status' => 'pending',
    ]);

    $vendorBOnlyOrder = Order::create([
        'user_id' => $customer->id,
        'code' => 'ORD-B-001',
        'status' => 'pending',
        'currency' => 'PKR',
        'subtotal' => 500,
        'grand_total' => 500,
        'payment_status' => 'paid',
    ]);
    OrderItem::create([
        'order_id' => $vendorBOnlyOrder->id,
        'store_id' => $storeB->id,
        'product_id' => $productB->id,
        'name' => $productB->name,
        'sku' => $productB->sku,
        'quantity' => 1,
        'unit_price' => 500,
        'subtotal' => 500,
        'status' => 'pending',
    ]);

    $this->actingAs($vendorA, 'api');
    $response = $this->getJson('/api/user/vendor-orders')
        ->assertSuccessful()
        ->assertJsonPath('data.pagination.total', 1)
        ->assertJsonPath('data.items.0.code', 'ORD-MIX-001')
        ->assertJsonPath('data.items.0.items.0.store.id', $storeA->id)
        ->json('data.items.0.items');

    expect($response)->toHaveCount(1);
});

it('blocks vendor from viewing order without their products', function () {
    $vendorA = User::factory()->create();
    $vendorA->assignRole(Role::findByName('vendor'));
    $vendorA->givePermissionTo(['orders.view', 'orders.update']);
    $vendorB = User::factory()->create();
    $vendorB->assignRole(Role::findByName('vendor'));
    $vendorB->givePermissionTo(['orders.view', 'orders.update']);
    $customer = User::factory()->create();

    $storeB = Store::create([
        'owner_id' => $vendorB->id,
        'name' => 'Store B',
        'slug' => 'store-b-'.Str::random(4),
        'status' => 'active',
    ]);
    $category = Category::create([
        'name' => 'Orders',
        'slug' => 'orders-'.Str::random(4),
        'is_active' => true,
        'sort_order' => 1,
    ]);
    $productB = Product::create([
        'store_id' => $storeB->id,
        'category_id' => $category->id,
        'name' => 'Product B',
        'slug' => 'product-b-'.Str::random(4),
        'sku' => 'B-1',
        'price' => 500,
        'stock' => 5,
    ]);
    $order = Order::create([
        'user_id' => $customer->id,
        'code' => 'ORD-B-ONLY',
        'status' => 'pending',
        'currency' => 'PKR',
        'subtotal' => 500,
        'grand_total' => 500,
        'payment_status' => 'paid',
    ]);
    $item = OrderItem::create([
        'order_id' => $order->id,
        'store_id' => $storeB->id,
        'product_id' => $productB->id,
        'name' => $productB->name,
        'sku' => $productB->sku,
        'quantity' => 1,
        'unit_price' => 500,
        'subtotal' => 500,
        'status' => 'pending',
    ]);

    $this->actingAs($vendorA, 'api');
    $this->getJson("/api/user/vendor-orders/{$order->id}")->assertNotFound();
    $this->patchJson("/api/user/vendor-orders/{$order->id}/items/{$item->id}/status", [
        'status' => 'shipped',
    ])->assertNotFound();
});

it('lets vendor update own order item status', function () {
    $vendor = User::factory()->create();
    $vendor->assignRole(Role::findByName('vendor'));
    $vendor->givePermissionTo(['orders.view', 'orders.update']);
    $customer = User::factory()->create();

    $store = Store::create([
        'owner_id' => $vendor->id,
        'name' => 'Store A',
        'slug' => 'store-a-'.Str::random(4),
        'status' => 'active',
    ]);
    $category = Category::create([
        'name' => 'Orders',
        'slug' => 'orders-'.Str::random(4),
        'is_active' => true,
        'sort_order' => 1,
    ]);
    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Product A',
        'slug' => 'product-a-'.Str::random(4),
        'sku' => 'A-1',
        'price' => 1000,
        'stock' => 5,
    ]);
    $order = Order::create([
        'user_id' => $customer->id,
        'code' => 'ORD-A-ONLY',
        'status' => 'pending',
        'currency' => 'PKR',
        'subtotal' => 1000,
        'grand_total' => 1000,
        'payment_status' => 'paid',
    ]);
    $item = OrderItem::create([
        'order_id' => $order->id,
        'store_id' => $store->id,
        'product_id' => $product->id,
        'name' => $product->name,
        'sku' => $product->sku,
        'quantity' => 1,
        'unit_price' => 1000,
        'subtotal' => 1000,
        'status' => 'pending',
    ]);

    $this->actingAs($vendor, 'api');
    $this->patchJson("/api/user/vendor-orders/{$order->id}/items/{$item->id}/status", [
        'status' => 'shipped',
    ])->assertSuccessful()
        ->assertJsonPath('data.item_status', 'shipped')
        ->assertJsonPath('data.order_status', 'shipped');
});

it('lets vendor update order status and returns timeline', function () {
    $vendor = User::factory()->create();
    $vendor->assignRole(Role::findByName('vendor'));
    $vendor->givePermissionTo(['orders.view', 'orders.update']);
    $customer = User::factory()->create();

    $store = Store::create([
        'owner_id' => $vendor->id,
        'name' => 'Store A',
        'slug' => 'store-a-'.Str::random(4),
        'status' => 'active',
    ]);
    $category = Category::create([
        'name' => 'Orders',
        'slug' => 'orders-'.Str::random(4),
        'is_active' => true,
        'sort_order' => 1,
    ]);
    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Product A',
        'slug' => 'product-a-'.Str::random(4),
        'sku' => 'A-1',
        'price' => 1000,
        'stock' => 5,
    ]);
    $order = Order::create([
        'user_id' => $customer->id,
        'code' => 'ORD-A-STATUS',
        'status' => 'pending',
        'currency' => 'PKR',
        'subtotal' => 1000,
        'grand_total' => 1000,
        'payment_status' => 'paid',
    ]);
    OrderItem::create([
        'order_id' => $order->id,
        'store_id' => $store->id,
        'product_id' => $product->id,
        'name' => $product->name,
        'sku' => $product->sku,
        'quantity' => 1,
        'unit_price' => 1000,
        'subtotal' => 1000,
        'status' => 'pending',
    ]);

    $this->actingAs($vendor, 'api');
    $this->patchJson("/api/user/vendor-orders/{$order->id}/status", [
        'to_status' => 'confirmed',
        'comment' => 'Vendor confirmed order',
    ])->assertSuccessful()
        ->assertJsonPath('data.status', 'confirmed');

    $this->getJson("/api/user/vendor-orders/{$order->id}/timeline")
        ->assertSuccessful()
        ->assertJsonPath('data.0.to_status', 'confirmed');
});

it('lets vendor capture payment, refund and create shipment for own order', function () {
    $vendor = User::factory()->create();
    $vendor->assignRole(Role::findByName('vendor'));
    $vendor->givePermissionTo(['orders.view', 'payments.capture', 'orders.refund', 'shipments.update']);
    $customer = User::factory()->create();

    $store = Store::create([
        'owner_id' => $vendor->id,
        'name' => 'Store A',
        'slug' => 'store-a-'.Str::random(4),
        'status' => 'active',
    ]);
    $category = Category::create([
        'name' => 'Orders',
        'slug' => 'orders-'.Str::random(4),
        'is_active' => true,
        'sort_order' => 1,
    ]);
    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Product A',
        'slug' => 'product-a-'.Str::random(4),
        'sku' => 'A-1',
        'price' => 1000,
        'stock' => 5,
    ]);
    $order = Order::create([
        'user_id' => $customer->id,
        'code' => 'ORD-A-PAY',
        'status' => 'pending',
        'currency' => 'PKR',
        'subtotal' => 1000,
        'grand_total' => 1000,
        'payment_status' => 'unpaid',
    ]);
    OrderItem::create([
        'order_id' => $order->id,
        'store_id' => $store->id,
        'product_id' => $product->id,
        'name' => $product->name,
        'sku' => $product->sku,
        'quantity' => 1,
        'unit_price' => 1000,
        'subtotal' => 1000,
        'status' => 'pending',
    ]);

    $this->actingAs($vendor, 'api');

    $this->postJson("/api/user/vendor-orders/{$order->id}/payments", [
        'method' => 'cod',
        'amount' => 1000,
    ])->assertCreated()
        ->assertJsonPath('data.status', 'succeeded');

    $this->postJson("/api/user/vendor-orders/{$order->id}/refund", [
        'amount' => 200,
        'reason' => 'Customer request',
    ])->assertSuccessful()
        ->assertJsonPath('data.status', 'refunded');

    $this->postJson("/api/user/vendor-orders/{$order->id}/shipments", [
        'store_id' => $store->id,
        'carrier' => 'TCS',
        'tracking_no' => 'TRK-123',
        'cost' => 100,
    ])->assertCreated()
        ->assertJsonPath('data.store_id', $store->id)
        ->assertJsonPath('data.status', 'pending');
});
