<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Los pictogramas que el niño tocó, en orden (la frase que armó).
        Schema::create('uso_tablero_pictogramas', function (Blueprint $table) {
            $table->foreignUlid('uso_tablero_id')->constrained('usos_tablero')->cascadeOnDelete();
            $table->smallInteger('orden');
            $table->foreignUlid('pictograma_id')->index()->constrained('pictogramas')->restrictOnDelete();

            $table->primary(['uso_tablero_id', 'orden']);
        });

        DB::statement('ALTER TABLE uso_tablero_pictogramas ADD CONSTRAINT uso_tablero_pictogramas_orden_positivo CHECK (orden > 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('uso_tablero_pictogramas');
    }
};
