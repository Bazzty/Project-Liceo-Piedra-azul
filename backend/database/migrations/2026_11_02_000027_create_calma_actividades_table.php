<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('calma_actividades', function (Blueprint $table) {
            $table->foreignUlid('momento_calma_id')->constrained('momentos_calma')->cascadeOnDelete();
            $table->enum('actividad', ['respirar', 'burbujas', 'luciernagas', 'dibujar']);

            $table->primary(['momento_calma_id', 'actividad']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('calma_actividades');
    }
};
