<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Palabras en las que el niño necesitó ayuda. Se guarda el texto tal como lo jugó.
        Schema::create('juego_palabras_dificiles', function (Blueprint $table) {
            $table->foreignUlid('sesion_juego_id')->constrained('sesiones_juego')->cascadeOnDelete();
            $table->string('palabra', 60);

            $table->primary(['sesion_juego_id', 'palabra']);
        });

        DB::statement("ALTER TABLE juego_palabras_dificiles ADD CONSTRAINT juego_palabras_dificiles_palabra_no_vacia CHECK (btrim(palabra) <> '')");
    }

    public function down(): void
    {
        Schema::dropIfExists('juego_palabras_dificiles');
    }
};
