<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ShopCustomer;
use App\Models\ShopSale;
use App\Models\StockItem;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createShopContext(): array
{
    $user = User::factory()->create();
    $user->givePermissionTo('create sales', 'edit sales');

    $store = Store::create([
        'owner_id' => $user->id,
        'name' => 'Shop Store',
        'slug' => 'shop-store',
        'status' => 'active',
    ]);

    $category = Category::create([
        'name' => 'Hardware',
        'slug' => 'hardware',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Copper Wire',
        'slug' => 'copper-wire',
        'sku' => 'WIRE-001',
        'price' => 150,
        'purchase_price' => 100,
        'stock' => 20,
        'low_stock_threshold' => 5,
    ]);

    return [$user, $product];
}

it('records a shop sale, creates a customer for credit, and deducts stock', function () {
    [$user, $product] = createShopContext();

    $this->actingAs($user);

    $response = $this->postJson('/api/shop/sales', [
        'customer_name' => 'Ahmad Electric',
        'customer_phone' => '03001234567',
        'customer_address' => 'Saddar Market',
        'received_amount' => 100,
        'payment_method' => 'cash',
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 2,
                'unit_price' => 150,
            ],
        ],
    ]);

    $response->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.payment_status', 'partial');

    $saleId = (int) $response->json('data.id');
    $sale = ShopSale::with('customer')->findOrFail($saleId);

    expect($sale->subtotal)->toBe(300.0);
    expect($sale->received_amount)->toBe(100.0);
    expect($sale->balance_due)->toBe(200.0);
    expect($sale->profit_amount)->toBe(100.0);
    expect($sale->customer?->name)->toBe('Ahmad Electric');
    expect($product->fresh()?->stock)->toBe(18);

    $this->assertDatabaseHas('shop_sale_items', [
        'sale_id' => $sale->id,
        'product_id' => $product->id,
        'quantity' => 2,
    ]);

    $this->assertDatabaseHas('shop_sale_payments', [
        'sale_id' => $sale->id,
        'amount' => 100,
        'method' => 'cash',
    ]);
});

it('collects an additional payment and settles the remaining balance', function () {
    [$user, $product] = createShopContext();

    $customer = ShopCustomer::create([
        'name' => 'Bilal Traders',
        'phone' => '03111222333',
    ]);

    $sale = ShopSale::create([
        'customer_id' => $customer->id,
        'created_by' => $user->id,
        'bill_no' => 'BILL-20260424-001',
        'sale_date' => now()->toDateString(),
        'subtotal' => 300,
        'received_amount' => 50,
        'balance_due' => 250,
        'profit_amount' => 100,
        'payment_status' => 'partial',
    ]);

    $this->actingAs($user);

    $response = $this->postJson("/api/shop/sales/{$sale->id}/payments", [
        'amount' => 250,
        'method' => 'bank',
        'note' => 'Customer cleared pending amount.',
    ]);

    $response->assertCreated()
        ->assertJsonPath('success', true);

    expect($sale->fresh()?->received_amount)->toBe(300.0);
    expect($sale->fresh()?->balance_due)->toBe(0.0);
    expect($sale->fresh()?->payment_status)->toBe('paid');

    $this->assertDatabaseHas('shop_sale_payments', [
        'sale_id' => $sale->id,
        'customer_id' => $customer->id,
        'amount' => 250,
        'method' => 'bank',
    ]);

    expect($product->fresh()?->stock)->toBe(20);
});

it('stores and updates stock batch and quantity details', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('create stock', 'edit stock', 'delete stock');
    $this->actingAs($user);

    $createResponse = $this->postJson('/api/shop/stock', [
        'item_name' => 'Premier Cement - 50kg',
        'batch_lot_number' => 'LOT-2026-05',
        'purchase_price' => 1120,
        'selling_price' => 1180,
        'quantity' => 24,
    ]);

    $createResponse->assertCreated()->assertJsonPath('success', true);

    $stockItemId = (int) $createResponse->json('data.id');
    $stockItem = StockItem::findOrFail($stockItemId);

    expect($stockItem->batch_lot_number)->toBe('LOT-2026-05');
    expect($stockItem->quantity)->toBe(24);

    $updateResponse = $this->patchJson("/api/shop/stock/{$stockItem->id}", [
        'item_name' => 'Premier Cement - 50kg',
        'batch_lot_number' => 'LOT-2026-05-B',
        'purchase_price' => 1130,
        'selling_price' => 1190,
        'quantity' => 18,
    ]);

    $updateResponse->assertOk()->assertJsonPath('success', true);

    expect($stockItem->fresh()?->batch_lot_number)->toBe('LOT-2026-05-B');
    expect($stockItem->fresh()?->quantity)->toBe(18);
    expect($stockItem->fresh()?->selling_price)->toBe(1190.0);
});
