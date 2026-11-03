<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cuento_tema', function (Blueprint $table) {
            $table->foreignUlid('cuento_id')->constrained('cuentos')->cascadeOnDelete();
            $table->foreignUlid('tema_id')->index()->constrained('temas')->cascadeOnDelete();

            $table->primary(['cuento_id', 'tema_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cuento_tema');
    }
};
