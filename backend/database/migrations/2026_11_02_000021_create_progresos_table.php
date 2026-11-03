<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Estado actual de cada niño en cada cuento (una sola fila por par). Las estrellas y stickers se calculan desde aquí.
        Schema::create('progresos', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('estudiante_id')->constrained('estudiantes')->cascadeOnDelete();
            $table->foreignUlid('cuento_id')->index()->constrained('cuentos')->restrictOnDelete();
            $table->smallInteger('pagina_actual')->nullable();
            $table->boolean('completado')->default(false);
            $table->timestampTz('ultimo_acceso_at')->useCurrent();
            $table->timestampsTz();

            $table->unique(['estudiante_id', 'cuento_id']);
        });

        DB::statement('ALTER TABLE progresos ADD CONSTRAINT progresos_pagina_positiva CHECK (pagina_actual > 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('progresos');
    }
};
