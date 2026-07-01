<?php

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Shipment;
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

it('returns vendor dashboard stats scoped to owned store', function () {
    $vendor = User::factory()->create();
    $vendor->assignRole(Role::findByName('vendor'));
    $otherVendor = User::factory()->create();
    $otherVendor->assignRole(Role::findByName('vendor'));
    $customer = User::factory()->create();

    $store = Store::create([
        'owner_id' => $vendor->id,
        'name' => 'Vendor Store',
        'slug' => 'vendor-store-'.Str::random(4),
        'status' => 'active',
    ]);
    $otherStore = Store::create([
        'owner_id' => $otherVendor->id,
        'name' => 'Other Store',
        'slug' => 'other-store-'.Str::random(4),
        'status' => 'active',
    ]);
    $category = Category::create([
        'name' => 'Cat',
        'slug' => 'cat-'.Str::random(4),
        'is_active' => true,
        'sort_order' => 1,
    ]);
    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'P1',
        'slug' => 'p1-'.Str::random(4),
        'sku' => 'SKU-1',
        'price' => 1000,
        'stock' => 5,
    ]);
    Product::create([
        'store_id' => $otherStore->id,
        'category_id' => $category->id,
        'name' => 'P2',
        'slug' => 'p2-'.Str::random(4),
        'sku' => 'SKU-2',
        'price' => 500,
        'stock' => 5,
    ]);

    $order = Order::create([
        'user_id' => $customer->id,
        'code' => 'ORD-STAT-1',
        'status' => 'pending',
        'currency' => 'PKR',
        'subtotal' => 2000,
        'grand_total' => 2000,
        'payment_status' => 'paid',
        'created_at' => now(),
    ]);
    OrderItem::create([
        'order_id' => $order->id,
        'store_id' => $store->id,
        'product_id' => $product->id,
        'name' => $product->name,
        'sku' => $product->sku,
        'quantity' => 2,
        'unit_price' => 1000,
        'subtotal' => 2000,
        'status' => 'pending',
    ]);
    Payment::create([
        'order_id' => $order->id,
        'method' => 'cod',
        'amount' => 2000,
        'status' => 'succeeded',
    ]);
    Shipment::create([
        'order_id' => $order->id,
        'store_id' => $store->id,
        'status' => 'pending',
        'cost' => 0,
    ]);

    $this->actingAs($vendor, 'api');
    $this->getJson('/api/user/vendor-dashboard')
        ->assertSuccessful()
        ->assertJsonPath('data.my_products', 1)
        ->assertJsonPath('data.my_orders', 1)
        ->assertJsonPath('data.pending_orders', 1)
        ->assertJsonPath('data.payments', 1)
        ->assertJsonPath('data.shipments', 1)
        ->assertJsonPath('data.sales.today', 2000)
        ->assertJsonPath('data.sales.total', 2000);
});

it('forbids non-vendor users from vendor dashboard stats', function () {
    $user = User::factory()->create();
    $this->actingAs($user, 'api');
    $this->getJson('/api/user/vendor-dashboard')->assertForbidden();
});
