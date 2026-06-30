<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Recover from a prior partial run (MySQL commits DDL before indexes are applied).
        Schema::dropIfExists('user_fcm_tokens');

        Schema::create('user_fcm_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('token', 512);
            $table->string('platform', 20);
            $table->string('device_id', 191)->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            $table->unique(['token']);
            $table->index(['user_id', 'platform']);
            $table->index(['user_id', 'device_id']);
        });

        // Backfill legacy single-token column into the new table (mobile).
        if (Schema::hasColumn('users', 'fcm_token')) {
            DB::table('users')
                ->whereNotNull('fcm_token')
                ->where('fcm_token', '!=', '')
                ->orderBy('id')
                ->chunkById(200, function ($users) {
                    $rows = [];
                    $now = now();

                    foreach ($users as $user) {
                        $rows[] = [
                            'user_id' => $user->id,
                            'token' => $user->fcm_token,
                            'platform' => 'mobile',
                            'device_id' => null,
                            'last_used_at' => $now,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }

                    if ($rows !== []) {
                        DB::table('user_fcm_tokens')->insertOrIgnore($rows);
                    }
                });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('user_fcm_tokens');
    }
};
