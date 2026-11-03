<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sesiones_aula', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('curso_id')->constrained('cursos')->restrictOnDelete();
            $table->foreignUlid('abierta_por')->index()->constrained('usuarios')->restrictOnDelete();
            // Agenda visual «Primero – Después» que la docente deja para la clase.
            $table->enum('agenda_primero', ['leer', 'hablar', 'estrellas']);
            $table->enum('agenda_despues', ['leer', 'hablar', 'estrellas']);
            $table->timestampTz('inicio_at')->useCurrent();
            $table->timestampTz('expira_at');
            $table->timestampTz('cerrada_at')->nullable();

            $table->index(['curso_id', 'inicio_at']);
        });

        DB::statement('ALTER TABLE sesiones_aula ADD CONSTRAINT sesiones_aula_expira_despues CHECK (expira_at > inicio_at)');
        DB::statement('ALTER TABLE sesiones_aula ADD CONSTRAINT sesiones_aula_cierre_valido CHECK (cerrada_at >= inicio_at)');
        DB::statement('ALTER TABLE sesiones_aula ADD CONSTRAINT sesiones_aula_agenda_distinta CHECK (agenda_primero <> agenda_despues)');
        // Un curso no puede tener dos sesiones abiertas al mismo tiempo. La sesión dura hasta que se
        // cierra o, si nadie la cierra, hasta que expira.
        DB::statement(<<<'SQL'
            ALTER TABLE sesiones_aula ADD CONSTRAINT sesiones_aula_sin_superponer
            EXCLUDE USING gist (curso_id WITH =, tstzrange(inicio_at, coalesce(cerrada_at, expira_at)) WITH &&)
        SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('sesiones_aula');
    }
};
