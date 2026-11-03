<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('temas', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('nombre', 60);
            $table->timestampsTz();
        });

        DB::statement("ALTER TABLE temas ADD CONSTRAINT temas_nombre_no_vacio CHECK (btrim(nombre) <> '')");
        // «Animales» y «animales» son el mismo tema.
        DB::statement('CREATE UNIQUE INDEX temas_nombre_unique ON temas (lower(nombre))');
    }

    public function down(): void
    {
        Schema::dropIfExists('temas');
    }
};
