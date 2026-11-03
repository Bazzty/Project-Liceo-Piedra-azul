<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lecturas', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('ingreso_id')->constrained('ingresos')->cascadeOnDelete();
            $table->foreignUlid('cuento_id')->index()->constrained('cuentos')->restrictOnDelete();
            $table->smallInteger('pagina_hasta');
            $table->integer('palabras_escuchadas')->default(0);
            $table->timestampTz('ocurrido_at')->useCurrent();

            $table->index(['ingreso_id', 'ocurrido_at']);
        });

        DB::statement('ALTER TABLE lecturas ADD CONSTRAINT lecturas_pagina_positiva CHECK (pagina_hasta > 0)');
        DB::statement('ALTER TABLE lecturas ADD CONSTRAINT lecturas_palabras_no_negativas CHECK (palabras_escuchadas >= 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('lecturas');
    }
};
