<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Cuentos y actividades de palabras sueltas comparten tabla: así comparten revisión, tareas y progreso
        // con claves foráneas reales, sin relaciones polimórficas.
        Schema::create('cuentos', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->enum('tipo', ['cuento', 'actividad'])->default('cuento');
            $table->string('titulo', 120);
            $table->text('descripcion')->nullable();
            $table->string('portada_path')->nullable();
            $table->string('portada_alt', 200)->nullable();
            $table->foreignUlid('nivel_id')->constrained('niveles')->restrictOnDelete();
            $table->foreignUlid('autor_id')->index()->constrained('usuarios')->restrictOnDelete();
            // Solo cambia al registrar una validación (ver la migración de validaciones).
            $table->enum('estado', ['borrador', 'en_revision', 'publicado', 'archivado'])->default('borrador');
            $table->smallInteger('orden')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();

            // El catálogo del niño: cuentos publicados de un nivel, en orden.
            $table->index(['nivel_id', 'estado', 'orden']);
        });

        DB::statement("ALTER TABLE cuentos ADD CONSTRAINT cuentos_titulo_no_vacio CHECK (btrim(titulo) <> '')");
        DB::statement("ALTER TABLE cuentos ADD CONSTRAINT cuentos_portada_con_alt CHECK (portada_path IS NULL OR btrim(coalesce(portada_alt, '')) <> '')");
        DB::statement('ALTER TABLE cuentos ADD CONSTRAINT cuentos_orden_positivo CHECK (orden > 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('cuentos');
    }
};
