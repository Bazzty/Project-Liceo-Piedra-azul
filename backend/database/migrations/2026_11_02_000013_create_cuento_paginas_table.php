<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cuento_paginas', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('cuento_id')->constrained('cuentos')->cascadeOnDelete();
            $table->smallInteger('numero');
            // La oración completa es la fuente de verdad; pagina_palabras la anota palabra por palabra.
            $table->text('texto');
            $table->string('audio_path')->nullable();
            $table->string('imagen_path')->nullable();
            $table->string('imagen_alt', 200)->nullable();
            $table->timestampsTz();
        });

        // DEFERRABLE: al reordenar páginas dentro de una transacción se puede usar
        // SET CONSTRAINTS ... DEFERRED y la regla se revisa recién al confirmar.
        DB::statement('ALTER TABLE cuento_paginas ADD CONSTRAINT cuento_paginas_cuento_id_numero_unique UNIQUE (cuento_id, numero) DEFERRABLE INITIALLY IMMEDIATE');
        DB::statement('ALTER TABLE cuento_paginas ADD CONSTRAINT cuento_paginas_numero_positivo CHECK (numero > 0)');
        DB::statement("ALTER TABLE cuento_paginas ADD CONSTRAINT cuento_paginas_texto_no_vacio CHECK (btrim(texto) <> '')");
        DB::statement("ALTER TABLE cuento_paginas ADD CONSTRAINT cuento_paginas_imagen_con_alt CHECK (imagen_path IS NULL OR btrim(coalesce(imagen_alt, '')) <> '')");
    }

    public function down(): void
    {
        Schema::dropIfExists('cuento_paginas');
    }
};
