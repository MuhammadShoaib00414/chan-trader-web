<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->unsignedBigInteger('brand_id')->nullable();
            $table->string('name', 180);
            $table->string('slug', 200)->unique();
            $table->string('sku', 64)->unique();
            $table->string('short_description', 300)->nullable();
            $table->longText('description')->nullable();
            $table->decimal('price', 12, 2);
            $table->decimal('compare_at', 12, 2)->nullable();
            $table->string('unit', 32)->nullable();
            $table->smallInteger('warranty_months')->nullable();
            $table->boolean('is_published')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->decimal('rating_avg', 3, 2)->default(0.00);
            $table->integer('rating_count')->default(0);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['store_id', 'category_id']);
            $table->index(['is_published', 'updated_at']);
            $table->foreign('brand_id')->references('id')->on('brands')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
