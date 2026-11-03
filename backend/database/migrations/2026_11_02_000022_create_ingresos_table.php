<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Cada vez que un niño entra. Lo que hace después (leer, jugar, calmarse, usar el tablero) cuelga
        // de su ingreso, así el lugar se guarda una sola vez (3FN).
        Schema::create('ingresos', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('estudiante_id')->constrained('estudiantes')->cascadeOnDelete();
            $table->enum('lugar', ['liceo', 'casa']);
            $table->foreignUlid('sesion_aula_id')->nullable()->index()->constrained('sesiones_aula')->restrictOnDelete();
            $table->timestampTz('inicio_at')->useCurrent();
            $table->timestampTz('fin_at')->nullable();

            $table->index(['estudiante_id', 'inicio_at']);
        });

        // En el liceo se entra siempre dentro de una sesión de aula; en casa, nunca.
        DB::statement("ALTER TABLE ingresos ADD CONSTRAINT ingresos_sesion_segun_lugar CHECK ((lugar = 'liceo') = (sesion_aula_id IS NOT NULL))");
        DB::statement('ALTER TABLE ingresos ADD CONSTRAINT ingresos_fin_despues CHECK (fin_at >= inicio_at)');

        // La sesión de aula tiene que ser del curso del niño. Se revisa con un trigger y no con una clave
        // compuesta para que el niño pueda cambiarse de curso sin tocar sus ingresos anteriores.
        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION ingresos_sesion_del_curso() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN
                IF NEW.sesion_aula_id IS NOT NULL AND NOT EXISTS (
                    SELECT 1 FROM sesiones_aula s JOIN estudiantes e ON e.curso_id = s.curso_id
                    WHERE s.id = NEW.sesion_aula_id AND e.id = NEW.estudiante_id
                ) THEN
                    RAISE EXCEPTION 'ingresos_sesion_del_curso: la sesión de aula % no es del curso del estudiante %',
                        NEW.sesion_aula_id, NEW.estudiante_id;
                END IF;
                RETURN NEW;
            END;
            $$;

            CREATE TRIGGER ingresos_sesion_del_curso
            BEFORE INSERT OR UPDATE OF estudiante_id, sesion_aula_id ON ingresos
            FOR EACH ROW EXECUTE FUNCTION ingresos_sesion_del_curso();
        SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('ingresos');
        DB::statement('DROP FUNCTION IF EXISTS ingresos_sesion_del_curso()');
    }
};
