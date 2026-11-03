<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('usuarios', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('nombre', 120);
            $table->string('email')->unique();
            $table->string('password');
            $table->enum('rol', ['admin', 'docente', 'revisor']);
            $table->boolean('activo')->default(true);
            $table->timestampsTz();
        });

        // El correo se guarda en minúsculas: así el índice único no deja pasar «Ana@x.cl» y «ana@x.cl» a la vez.
        DB::statement('ALTER TABLE usuarios ADD CONSTRAINT usuarios_email_minusculas CHECK (email = lower(email))');
        DB::statement("ALTER TABLE usuarios ADD CONSTRAINT usuarios_nombre_no_vacio CHECK (btrim(nombre) <> '')");
    }

    public function down(): void
    {
        Schema::dropIfExists('usuarios');
    }
};
