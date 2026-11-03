<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categorias_pictograma', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('clave', 30)->unique();
            $table->string('nombre', 60);
            $table->smallInteger('orden')->unique();
            $table->timestampsTz();
        });

        DB::statement("ALTER TABLE categorias_pictograma ADD CONSTRAINT categorias_pictograma_nombre_no_vacio CHECK (btrim(nombre) <> '')");
        DB::statement('ALTER TABLE categorias_pictograma ADD CONSTRAINT categorias_pictograma_orden_positivo CHECK (orden > 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('categorias_pictograma');
    }
};
