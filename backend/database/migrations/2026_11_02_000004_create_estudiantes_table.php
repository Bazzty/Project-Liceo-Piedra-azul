<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('estudiantes', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('curso_id')->index()->constrained('cursos')->restrictOnDelete();
            // Datos mínimos de menores: nombre e inicial del apellido, sin RUT ni fecha de nacimiento.
            $table->string('nombre', 60);
            $table->char('inicial_apellido', 1)->nullable();
            $table->enum('tema_visual', ['suave', 'alto-contraste', 'calida', 'monocromatica'])->default('suave');
            $table->string('personaje', 40)->nullable();
            $table->text('nota_docente')->nullable();
            // HMAC-SHA256 del código de la tarjeta. Es determinista para poder buscar al niño solo con su
            // código (en casa no elige su cara); la clave del HMAC vive en el .env, nunca en la base.
            $table->char('codigo_acceso_hash', 64)->nullable()->unique();
            $table->smallInteger('intentos_fallidos')->default(0);
            $table->timestampTz('bloqueado_hasta')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestampsTz();

            // Lo usa tarea_estudiante para comprobar que el niño es del mismo curso que la tarea.
            $table->unique(['id', 'curso_id']);
        });

        DB::statement("ALTER TABLE estudiantes ADD CONSTRAINT estudiantes_nombre_no_vacio CHECK (btrim(nombre) <> '')");
        DB::statement('ALTER TABLE estudiantes ADD CONSTRAINT estudiantes_inicial_mayuscula CHECK (inicial_apellido = upper(inicial_apellido))');
        DB::statement('ALTER TABLE estudiantes ADD CONSTRAINT estudiantes_intentos_no_negativos CHECK (intentos_fallidos >= 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('estudiantes');
    }
};
