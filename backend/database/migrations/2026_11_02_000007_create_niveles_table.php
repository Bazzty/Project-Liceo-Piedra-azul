<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('niveles', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('codigo', 5)->unique();
            $table->string('nombre', 80);
            $table->text('descripcion')->nullable();
            $table->smallInteger('orden')->unique();
            $table->timestampsTz();
        });

        DB::statement("ALTER TABLE niveles ADD CONSTRAINT niveles_nombre_no_vacio CHECK (btrim(nombre) <> '')");
        DB::statement('ALTER TABLE niveles ADD CONSTRAINT niveles_orden_positivo CHECK (orden > 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('niveles');
    }
};
