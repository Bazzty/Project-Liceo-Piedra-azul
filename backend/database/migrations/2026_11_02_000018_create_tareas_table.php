<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tareas', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('curso_id')->constrained('cursos')->restrictOnDelete();
            $table->foreignUlid('cuento_id')->index()->constrained('cuentos')->restrictOnDelete();
            $table->foreignUlid('creada_por')->index()->constrained('usuarios')->restrictOnDelete();
            // Si es para todo el curso no hay filas en tarea_estudiante. El estado (pendiente, hecha,
            // atrasada) no se guarda: se calcula con progresos y el límite.
            $table->boolean('para_todo_el_curso')->default(true);
            $table->date('limite')->nullable();
            $table->text('nota')->nullable();
            $table->timestampsTz();

            $table->index(['curso_id', 'limite']);
            $table->unique(['id', 'curso_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tareas');
    }
};
