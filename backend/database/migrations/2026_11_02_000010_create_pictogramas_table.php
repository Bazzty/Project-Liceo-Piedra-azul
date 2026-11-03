<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pictogramas', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('palabra', 80)->index();
            $table->foreignUlid('categoria_id')->index()->constrained('categorias_pictograma')->restrictOnDelete();
            $table->enum('origen', ['arasaac', 'propio', 'foto']);
            $table->integer('arasaac_id')->nullable()->unique();
            $table->string('imagen_path');
            $table->string('alt_text', 200);
            $table->string('audio_path')->nullable();
            $table->foreignUlid('subido_por')->nullable()->index()->constrained('usuarios')->nullOnDelete();
            // Un pictograma usado en cuentos no se borra: se desactiva.
            $table->boolean('activo')->default(true);
            $table->timestampsTz();
        });

        DB::statement("ALTER TABLE pictogramas ADD CONSTRAINT pictogramas_palabra_no_vacia CHECK (btrim(palabra) <> '')");
        DB::statement("ALTER TABLE pictogramas ADD CONSTRAINT pictogramas_alt_text_no_vacio CHECK (btrim(alt_text) <> '')");
        // Los de ARASAAC llevan su número de catálogo y los demás no.
        DB::statement("ALTER TABLE pictogramas ADD CONSTRAINT pictogramas_arasaac_id_segun_origen CHECK ((origen = 'arasaac') = (arasaac_id IS NOT NULL))");
        DB::statement('ALTER TABLE pictogramas ADD CONSTRAINT pictogramas_arasaac_id_positivo CHECK (arasaac_id > 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('pictogramas');
    }
};
