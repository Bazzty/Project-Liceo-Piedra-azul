<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cursos', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('nombre', 60);
            $table->smallInteger('anio');
            $table->foreignUlid('docente_id')->index()->constrained('usuarios')->restrictOnDelete();
            $table->timestampsTz();

            $table->unique(['nombre', 'anio']);
        });

        DB::statement("ALTER TABLE cursos ADD CONSTRAINT cursos_nombre_no_vacio CHECK (btrim(nombre) <> '')");
        DB::statement('ALTER TABLE cursos ADD CONSTRAINT cursos_anio_valido CHECK (anio BETWEEN 2024 AND 2100)');
    }

    public function down(): void
    {
        Schema::dropIfExists('cursos');
    }
};
