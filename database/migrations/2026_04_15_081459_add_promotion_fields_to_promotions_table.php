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
        Schema::table('promotions', function (Blueprint $table) {
            // Basic info
            $table->string('name')->nullable()->after('product_id');
            
            // Content fields
            $table->string('title')->nullable()->after('name');
            $table->string('subtitle')->nullable()->after('title');
            $table->text('description')->nullable()->after('subtitle');
            
            // Button fields
            $table->string('button_text')->nullable()->after('description');
            $table->string('button_link')->nullable()->after('button_text');
            
            // Status & scheduling
            $table->timestamp('start_datetime')->nullable()->after('end_date');
            $table->timestamp('end_datetime')->nullable()->after('start_datetime');
            
            // Sorting
            $table->integer('order_number')->default(0)->after('end_datetime');
            
            // Styling
            $table->string('text_color')->nullable()->after('order_number');
            $table->string('background_color')->nullable()->after('text_color');
            
            // Device type
            $table->enum('device_type', ['web', 'mobile'])->default('web')->after('background_color');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('promotions', function (Blueprint $table) {
            $table->dropColumn([
                'device_type',
                'background_color',
                'text_color',
                'order_number',
                'end_datetime',
                'start_datetime',
                'button_link',
                'button_text',
                'description',
                'subtitle',
                'title',
                'name'
            ]);
        });
    }
};
