<?php

use App\Enums\FcmPlatform;
use App\Enums\NotificationAction;
use App\Jobs\SendOrderPlacementNotificationsJob;
use App\Mail\AdminNewOrderMail;
use App\Mail\VendorNewOrderMail;
use App\Models\AppNotification;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use App\Models\UserFcmToken;
use App\Services\Notifications\AppNotificationService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('dispatches order placement notifications to customer admin and vendor', function () {
    Mail::fake();

    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));
    UserFcmToken::query()->create([
        'user_id' => $admin->id,
        'token' => 'admin-web-token',
        'platform' => FcmPlatform::Web,
    ]);

    $vendor = User::factory()->create();
    $vendor->assignRole(Role::findByName('vendor'));
    UserFcmToken::query()->create([
        'user_id' => $vendor->id,
        'token' => 'vendor-mobile-token',
        'platform' => FcmPlatform::Mobile,
    ]);

    $customer = User::factory()->create();
    UserFcmToken::query()->create([
        'user_id' => $customer->id,
        'token' => 'customer-mobile-token',
        'platform' => FcmPlatform::Mobile,
    ]);

    $store = Store::create([
        'owner_id' => $vendor->id,
        'name' => 'Vendor Store',
        'slug' => 'vendor-store-' . Str::random(4),
        'status' => 'active',
    ]);

    $category = Category::create([
        'name' => 'Notify Category',
        'slug' => 'notify-category-' . Str::random(4),
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $product = Product::create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'name' => 'Test Product',
        'slug' => 'test-product-' . Str::random(4),
        'sku' => 'SKU-1',
        'price' => 750,
        'stock' => 10,
    ]);

    $order = Order::create([
        'user_id' => $customer->id,
        'code' => 'ORD-TEST-001',
        'status' => 'pending',
        'currency' => 'PKR',
        'subtotal' => 1500,
        'grand_total' => 1500,
        'payment_status' => 'unpaid',
    ]);

    OrderItem::create([
        'order_id' => $order->id,
        'store_id' => $store->id,
        'product_id' => $product->id,
        'name' => 'Test Product',
        'sku' => 'SKU-1',
        'quantity' => 2,
        'unit_price' => 750,
        'subtotal' => 1500,
        'status' => 'pending',
    ]);

    $job = new SendOrderPlacementNotificationsJob($order->id, $customer->id);
    $job->handle(app(AppNotificationService::class));

    Mail::assertQueued(AdminNewOrderMail::class);
    Mail::assertQueued(VendorNewOrderMail::class);

    expect(AppNotification::query()->where('user_id', $customer->id)->where('type', NotificationAction::OrderPlaced->value)->exists())->toBeTrue();
    expect(AppNotification::query()->where('user_id', $admin->id)->where('type', NotificationAction::AdminNewOrder->value)->exists())->toBeTrue();
    expect(AppNotification::query()->where('user_id', $vendor->id)->where('type', NotificationAction::VendorNewOrder->value)->exists())->toBeTrue();

    $vendorNotification = AppNotification::query()
        ->where('user_id', $vendor->id)
        ->where('type', NotificationAction::VendorNewOrder->value)
        ->first();

    expect($vendorNotification?->order_id)->toBe($order->id);
    expect($vendorNotification?->store_id)->toBe($store->id);
});
