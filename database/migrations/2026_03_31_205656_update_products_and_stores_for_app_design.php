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
            $table->boolean('is_featured')->default(false)->after('is_published');
            $table->boolean('is_top_selling')->default(false)->after('is_featured');
            $table->string('condition', 50)->nullable()->after('name'); // New / Used / Imported
        });

        Schema::table('stores', function (Blueprint $table) {
            $table->string('address', 255)->nullable()->after('description');
            $table->string('city', 100)->nullable()->after('address');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['is_featured', 'is_top_selling', 'condition']);
        });

        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn(['address', 'city']);
        });
    }
};
