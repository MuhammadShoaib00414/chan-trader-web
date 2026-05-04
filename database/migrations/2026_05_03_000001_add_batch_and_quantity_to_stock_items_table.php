<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_items', function (Blueprint $table) {
            $table->string('batch_lot_number', 120)->nullable()->after('item_name');
            $table->unsignedInteger('quantity')->default(0)->after('selling_price');
        });
    }

    public function down(): void
    {
        Schema::table('stock_items', function (Blueprint $table) {
            $table->dropColumn(['batch_lot_number', 'quantity']);
        });
    }
};
