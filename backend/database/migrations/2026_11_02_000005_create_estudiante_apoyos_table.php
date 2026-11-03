<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Una fila por apoyo activo. Si el apoyo no está, la fila no existe (antes era una lista dentro del niño).
        Schema::create('estudiante_apoyos', function (Blueprint $table) {
            $table->foreignUlid('estudiante_id')->constrained('estudiantes')->cascadeOnDelete();
            $table->enum('apoyo', ['vozLenta', 'sinMovimiento', 'barrido', 'pocasOpciones']);
            $table->text('motivo')->nullable();
            $table->date('desde')->default(DB::raw('CURRENT_DATE'));
            $table->timestampsTz();

            $table->primary(['estudiante_id', 'apoyo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('estudiante_apoyos');
    }
};
