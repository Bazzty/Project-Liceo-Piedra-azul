<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tarea_estudiante', function (Blueprint $table) {
            $table->ulid('tarea_id');
            $table->ulid('estudiante_id')->index();
            // Repite el curso a propósito: las dos claves compuestas de abajo obligan a que el niño
            // sea del mismo curso que la tarea.
            $table->ulid('curso_id');

            $table->primary(['tarea_id', 'estudiante_id']);
            $table->foreign(['tarea_id', 'curso_id'])->references(['id', 'curso_id'])->on('tareas')->cascadeOnDelete();
            $table->foreign(['estudiante_id', 'curso_id'])->references(['id', 'curso_id'])->on('estudiantes')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tarea_estudiante');
    }
};
