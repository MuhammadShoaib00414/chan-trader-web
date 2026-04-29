<?php

use App\Models\Supplier;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->string('category')->default(Supplier::CATEGORY_LOCAL)->after('name');
        });

        DB::table('suppliers')->whereNull('category')->update([
            'category' => Supplier::CATEGORY_LOCAL,
        ]);
    }

    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropColumn('category');
        });
    }
};
