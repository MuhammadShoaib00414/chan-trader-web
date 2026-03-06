<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stores', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('name', 150);
            $table->string('slug', 160)->unique();
            $table->string('logo', 255)->nullable();
            $table->string('banner', 255)->nullable();
            $table->string('email', 150)->nullable();
            $table->string('phone', 30)->nullable();
            $table->text('description')->nullable();
            $table->json('socials')->nullable();
            $table->decimal('rating_avg', 3, 2)->default(0.00);
            $table->integer('followers_count')->default(0);
            $table->integer('products_count')->default(0);
            $table->enum('status', ['pending', 'active', 'suspended'])->default('pending');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index('owner_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stores');
    }
};
