<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sesiones_juego', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('ingreso_id')->constrained('ingresos')->cascadeOnDelete();
            $table->foreignUlid('cuento_id')->index()->constrained('cuentos')->restrictOnDelete();
            $table->smallInteger('aciertos');
            $table->smallInteger('total');
            // El juego le ofreció descansar y aceptó.
            $table->boolean('descanso')->default(false);
            $table->timestampTz('ocurrido_at')->useCurrent();

            $table->index(['ingreso_id', 'ocurrido_at']);
        });

        DB::statement('ALTER TABLE sesiones_juego ADD CONSTRAINT sesiones_juego_aciertos_validos CHECK (total > 0 AND aciertos BETWEEN 0 AND total)');
    }

    public function down(): void
    {
        Schema::dropIfExists('sesiones_juego');
    }
};
