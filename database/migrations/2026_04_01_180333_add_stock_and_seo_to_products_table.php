<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->integer('stock')->default(0)->after('price');
            $table->integer('low_stock_threshold')->default(10)->after('stock');
            $table->string('meta_title', 180)->nullable()->after('description');
            $table->string('meta_description', 160)->nullable()->after('meta_title');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['stock', 'low_stock_threshold', 'meta_title', 'meta_description']);
        });
    }
};
