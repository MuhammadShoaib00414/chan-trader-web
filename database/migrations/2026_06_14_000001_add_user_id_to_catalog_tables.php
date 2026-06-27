<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tables that get a nullable user_id owner column.
     *
     * @var array<int, string>
     */
    private array $tables = ['categories', 'subcategories', 'articles', 'brands'];

    public function up(): void
    {
        foreach ($this->tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName): void {
                if (! Schema::hasColumn($tableName, 'user_id')) {
                    $table->foreignId('user_id')
                        ->nullable()
                        ->after('id')
                        ->constrained('users')
                        ->nullOnDelete();
                    $table->index('user_id');
                }
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName): void {
                if (Schema::hasColumn($tableName, 'user_id')) {
                    $table->dropForeign([$tableName.'_user_id_foreign']);
                    $table->dropIndex([$tableName.'_user_id_index']);
                    $table->dropColumn('user_id');
                }
            });
        }
    }
};
