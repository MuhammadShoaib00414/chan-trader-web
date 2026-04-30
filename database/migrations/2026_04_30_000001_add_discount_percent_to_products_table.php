<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('discount_percent', 5, 2)->nullable()->after('price');
            $table->string('article', 160)->nullable()->after('name');
            $table->string('deal_name', 120)->nullable()->after('article');
            $table->string('limited_discount_text', 60)->nullable()->after('deal_name');
        });

        DB::table('products')
            ->select(['id', 'price', 'compare_at'])
            ->orderBy('id')
            ->chunkById(100, function ($products): void {
                foreach ($products as $product) {
                    $price = (float) ($product->price ?? 0);
                    $compareAt = (float) ($product->compare_at ?? 0);

                    if ($compareAt > $price && $compareAt > 0) {
                        $discountPercent = round((($compareAt - $price) / $compareAt) * 100, 2);

                        DB::table('products')
                            ->where('id', $product->id)
                            ->update([
                                'discount_percent' => $discountPercent,
                                'compare_at' => null,
                            ]);

                        continue;
                    }

                    DB::table('products')
                        ->where('id', $product->id)
                        ->update([
                            'discount_percent' => null,
                            'compare_at' => null,
                        ]);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['discount_percent', 'article', 'deal_name', 'limited_discount_text']);
        });
    }
};
