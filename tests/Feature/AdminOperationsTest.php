<?php

use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

it('allows admin to create a product variant', function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));

    $this->actingAs($admin);

    $store = Store::create([
        'owner_id' => $admin->id,
        'name' => 'Main Store',
        'slug' => 'main-store',
    ]);

    $product = \App\Models\Product::create([
        'store_id' => $store->id,
        'category_id' => 1,
        'name' => 'Test Product',
        'slug' => 'test-product-'.Str::random(5),
        'sku' => 'SKU-'.Str::random(6),
        'price' => 100,
    ]);

    $resp = $this->post("/api/admin/products/{$product->id}/variants", [
        'sku' => 'VSKU-'.Str::random(6),
        'price' => 110,
        'stock' => 5,
    ]);

    $resp->assertCreated();
});

it('allows admin to update order status', function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));
    $this->actingAs($admin);

    $user = User::factory()->create();
    $store = Store::create([
        'owner_id' => $admin->id,
        'name' => 'Ops Store',
        'slug' => 'ops-store',
    ]);

    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => 1,
        'name' => 'Order Prod',
        'slug' => 'order-prod-'.Str::random(5),
        'sku' => 'SKU-'.Str::random(6),
        'price' => 50,
    ]);

    $order = \App\Models\Order::create([
        'user_id' => $user->id,
        'code' => 'ORD-'.Str::upper(Str::random(8)),
        'status' => 'pending',
        'currency' => 'USD',
        'subtotal' => 50,
        'grand_total' => 50,
    ]);

    $resp = $this->patch("/api/admin/orders/{$order->id}/status", [
        'to_status' => 'confirmed',
    ]);

    $resp->assertOk();
});
