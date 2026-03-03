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
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone_number')->nullable()->after('email')->unique();
            $table->string('shop_name')->nullable()->after('phone_number');
            $table->string('city_district')->nullable()->after('shop_name');
            $table->text('address')->nullable()->after('city_district');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone_number', 'shop_name', 'city_district', 'address']);
        });
    }
};
