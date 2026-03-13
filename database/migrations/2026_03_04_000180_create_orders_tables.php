<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('code', 24)->unique();
            $table->enum('status', ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'])->default('pending');
            $table->unsignedBigInteger('shipping_address_id')->nullable();
            $table->char('currency', 3)->default('USD');
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('shipping_cost', 12, 2)->default(0);
            $table->decimal('discount_total', 12, 2)->default(0);
            $table->decimal('tax_total', 12, 2)->default(0);
            $table->decimal('grand_total', 12, 2)->default(0);
            $table->enum('payment_status', ['unpaid', 'paid', 'partial', 'refunded'])->default('unpaid');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['status', 'created_at']);
            $table->index('user_id');
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->unsignedBigInteger('product_variant_id')->nullable();
            $table->string('name', 180);
            $table->string('sku', 80)->nullable();
            $table->integer('quantity');
            $table->decimal('unit_price', 12, 2);
            $table->decimal('subtotal', 12, 2);
            $table->enum('status', ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'])->default('pending');
            $table->timestamps();
            $table->index('order_id');
            $table->index('store_id');
            $table->index('status');
            $table->foreign('product_variant_id')->references('id')->on('product_variants')->nullOnDelete();
        });

        Schema::create('order_status_history', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->unsignedBigInteger('store_id')->nullable();
            $table->string('from_status', 40)->nullable();
            $table->string('to_status', 40);
            $table->foreignId('changed_by')->constrained('users')->cascadeOnDelete();
            $table->string('comment', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index('order_id');
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->enum('method', ['cod', 'card', 'bank', 'wallet']);
            $table->decimal('amount', 12, 2);
            $table->enum('status', ['initiated', 'succeeded', 'failed', 'refunded'])->default('initiated');
            $table->string('provider_txn_id', 120)->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->index('order_id');
        });

        Schema::create('shipments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
            $table->string('carrier', 80)->nullable();
            $table->string('tracking_no', 120)->nullable();
            $table->enum('status', ['pending', 'shipped', 'in_transit', 'delivered', 'failed', 'returned'])->default('pending');
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->decimal('cost', 12, 2)->default(0);
            $table->timestamps();
            $table->index('order_id');
            $table->index('store_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipments');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('order_status_history');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
