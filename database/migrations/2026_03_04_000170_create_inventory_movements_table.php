<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('product_variant_id')->nullable();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->integer('qty');
            $table->enum('type', ['in', 'out', 'reserve', 'release', 'adjust']);
            $table->string('reason', 120)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('reference_type', 60)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index('product_id');
            $table->index('product_variant_id');
            $table->index(['type', 'created_at']);
            $table->foreign('product_variant_id')->references('id')->on('product_variants')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_movements');
    }
};
