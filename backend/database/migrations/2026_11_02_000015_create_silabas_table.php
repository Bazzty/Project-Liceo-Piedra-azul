<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Catálogo: el audio de «ma» es el mismo en «mamá» y en «cama», así que se guarda una sola vez.
        Schema::create('silabas', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('texto', 10)->unique();
            $table->string('audio_path')->nullable();
            $table->timestampsTz();
        });

        DB::statement("ALTER TABLE silabas ADD CONSTRAINT silabas_texto_minusculas CHECK (texto = lower(btrim(texto)) AND texto <> '')");
    }

    public function down(): void
    {
        Schema::dropIfExists('silabas');
    }
};
