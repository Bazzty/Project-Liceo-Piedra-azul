<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('usos_tablero', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('ingreso_id')->constrained('ingresos')->cascadeOnDelete();
            $table->timestampTz('ocurrido_at')->useCurrent();

            $table->index(['ingreso_id', 'ocurrido_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usos_tablero');
    }
};
