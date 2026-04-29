<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('purchase_price', 12, 2)->default(0)->after('price');
        });

        Schema::create('shop_customers', function (Blueprint $table) {
            $table->id();
            $table->string('name', 160);
            $table->string('phone', 40)->nullable();
            $table->text('address')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('name');
            $table->index('phone');
        });

        Schema::create('shop_sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->nullable()->constrained('shop_customers')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('bill_no', 32)->unique();
            $table->date('sale_date');
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('received_amount', 12, 2)->default(0);
            $table->decimal('balance_due', 12, 2)->default(0);
            $table->decimal('profit_amount', 12, 2)->default(0);
            $table->enum('payment_status', ['paid', 'partial', 'credit'])->default('paid');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['sale_date', 'payment_status']);
        });

        Schema::create('shop_sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('shop_sales')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->integer('quantity');
            $table->decimal('unit_price', 12, 2);
            $table->decimal('unit_cost', 12, 2)->default(0);
            $table->decimal('line_total', 12, 2);
            $table->decimal('profit_amount', 12, 2)->default(0);
            $table->timestamps();

            $table->index('product_id');
        });

        Schema::create('shop_sale_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('shop_sales')->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('shop_customers')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('amount', 12, 2);
            $table->enum('method', ['cash', 'bank', 'wallet'])->default('cash');
            $table->date('payment_date');
            $table->string('note', 255)->nullable();
            $table->timestamps();

            $table->index('payment_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shop_sale_payments');
        Schema::dropIfExists('shop_sale_items');
        Schema::dropIfExists('shop_sales');
        Schema::dropIfExists('shop_customers');

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('purchase_price');
        });
    }
};
