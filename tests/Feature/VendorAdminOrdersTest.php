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

function createVendorOrderFixture(): array
{
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

    return compact('vendorA', 'vendorB', 'mixedOrder', 'vendorBOnlyOrder');
}

it('shows only vendor store orders on admin orders page', function () {
    ['vendorA' => $vendorA, 'mixedOrder' => $mixedOrder] = createVendorOrderFixture();

    $this->actingAs($vendorA)
        ->get('/admin/orders')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/orders/index')
            ->has('items', 1)
            ->where('items.0.code', $mixedOrder->code)
            ->where('pagination.total', 1)
        );
});

it('blocks vendor from viewing another vendors order detail page', function () {
    ['vendorA' => $vendorA, 'vendorBOnlyOrder' => $vendorBOnlyOrder] = createVendorOrderFixture();

    $this->actingAs($vendorA)
        ->get("/admin/orders/{$vendorBOnlyOrder->id}")
        ->assertForbidden();
});

it('allows vendor to view order detail when their store has items', function () {
    ['vendorA' => $vendorA, 'mixedOrder' => $mixedOrder] = createVendorOrderFixture();

    $this->actingAs($vendorA)
        ->get("/admin/orders/{$mixedOrder->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/orders/show')
            ->where('order.code', $mixedOrder->code)
        );
});

it('scopes admin orders api list to vendor store orders', function () {
    ['vendorA' => $vendorA, 'mixedOrder' => $mixedOrder] = createVendorOrderFixture();

    $this->actingAs($vendorA)
        ->getJson('/api/admin/orders')
        ->assertSuccessful()
        ->assertJsonPath('pagination.total', 1)
        ->assertJsonPath('data.0.code', $mixedOrder->code);
});

it('blocks vendor from updating another vendors order via api', function () {
    ['vendorA' => $vendorA, 'vendorBOnlyOrder' => $vendorBOnlyOrder] = createVendorOrderFixture();

    $this->actingAs($vendorA)
        ->patchJson("/api/admin/orders/{$vendorBOnlyOrder->id}/status", [
            'to_status' => 'confirmed',
        ])
        ->assertForbidden();
});
