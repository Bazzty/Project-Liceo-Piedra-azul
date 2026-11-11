<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categorias_pictograma', function (Blueprint $table) {
            // El color de la franja de cada palabra y carpeta del tablero. Sale de la paleta de los temas, no es libre.
            $table->string('color', 20)->default('aprender');
        });

        DB::statement("ALTER TABLE categorias_pictograma ADD CONSTRAINT categorias_pictograma_color_valido CHECK (color IN ('aprender', 'hablar', 'colores', 'logros', 'alerta', 'info'))");

        // La docente reordena categorías: intercambiar dos pasa por un estado con el mismo orden repetido.
        // DEFERRABLE permite revisar la regla recién al confirmar la transacción.
        DB::statement('ALTER TABLE categorias_pictograma DROP CONSTRAINT categorias_pictograma_orden_unique');
        DB::statement('ALTER TABLE categorias_pictograma ADD CONSTRAINT categorias_pictograma_orden_unique UNIQUE (orden) DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE categorias_pictograma DROP CONSTRAINT categorias_pictograma_orden_unique');
        DB::statement('ALTER TABLE categorias_pictograma ADD CONSTRAINT categorias_pictograma_orden_unique UNIQUE (orden)');
        DB::statement('ALTER TABLE categorias_pictograma DROP CONSTRAINT categorias_pictograma_color_valido');

        Schema::table('categorias_pictograma', function (Blueprint $table) {
            $table->dropColumn('color');
        });
    }
};
