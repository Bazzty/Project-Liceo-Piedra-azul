<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Permite la restricción que impide dos sesiones de aula superpuestas en un mismo curso.
        DB::statement('CREATE EXTENSION IF NOT EXISTS btree_gist');

        // Para tablas de solo inserción (actas y auditoría): nadie puede editar ni borrar una fila.
        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION impedir_cambios() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN
                RAISE EXCEPTION 'La tabla % es de solo inserción', TG_TABLE_NAME;
            END;
            $$;
        SQL);
    }

    public function down(): void
    {
        DB::statement('DROP FUNCTION IF EXISTS impedir_cambios()');
    }
};
