<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'feature_image')) {
                $table->string('feature_image', 255)->nullable()->after('description');
            }
            if (! Schema::hasColumn('products', 'top_image')) {
                $table->string('top_image', 255)->nullable()->after('feature_image');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'feature_image')) {
                $table->dropColumn('feature_image');
            }
            if (Schema::hasColumn('products', 'top_image')) {
                $table->dropColumn('top_image');
            }
        });
    }
};
