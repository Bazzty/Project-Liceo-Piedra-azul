<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pagina_palabras', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('pagina_id')->constrained('cuento_paginas')->cascadeOnDelete();
            $table->smallInteger('orden');
            $table->string('texto', 60);
            // Palabra base para buscar el pictograma (p. ej. «saltar» para «salta»).
            $table->string('clave', 60)->nullable();
            $table->foreignUlid('pictograma_id')->nullable()->index()->constrained('pictogramas')->restrictOnDelete();
            $table->string('audio_path')->nullable();
            $table->timestampsTz();
        });

        DB::statement('ALTER TABLE pagina_palabras ADD CONSTRAINT pagina_palabras_pagina_id_orden_unique UNIQUE (pagina_id, orden) DEFERRABLE INITIALLY IMMEDIATE');
        DB::statement('ALTER TABLE pagina_palabras ADD CONSTRAINT pagina_palabras_orden_positivo CHECK (orden > 0)');
        DB::statement("ALTER TABLE pagina_palabras ADD CONSTRAINT pagina_palabras_texto_no_vacio CHECK (btrim(texto) <> '')");
    }

    public function down(): void
    {
        Schema::dropIfExists('pagina_palabras');
    }
};
