<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('momentos_calma', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('ingreso_id')->constrained('ingresos')->cascadeOnDelete();
            // Cómo dijo sentirse al salir (con caritas). Puede no contestar.
            $table->enum('animo', ['peor', 'igual', 'mejor'])->nullable();
            $table->integer('segundos');
            $table->timestampTz('ocurrido_at')->useCurrent();

            $table->index(['ingreso_id', 'ocurrido_at']);
        });

        DB::statement('ALTER TABLE momentos_calma ADD CONSTRAINT momentos_calma_segundos_no_negativos CHECK (segundos >= 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('momentos_calma');
    }
};
