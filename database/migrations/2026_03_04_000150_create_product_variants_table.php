<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_variants', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('sku', 80)->unique()->nullable();
            $table->string('variant_key', 255)->nullable();
            $table->decimal('price', 12, 2)->nullable();
            $table->decimal('compare_at', 12, 2)->nullable();
            $table->integer('stock')->default(0);
            $table->decimal('weight', 8, 3)->nullable();
            $table->decimal('length', 8, 2)->nullable();
            $table->decimal('width', 8, 2)->nullable();
            $table->decimal('height', 8, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index('product_id');
            $table->index('is_active');
            $table->index('variant_key');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
