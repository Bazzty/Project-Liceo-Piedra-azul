<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Tableros de comunicación (PLPA-109). Un tablero principal y las carpetas que abre forman un «conjunto»; el dueño
 * (plantilla de la docente o copia de un niño) está en el principal y las carpetas lo heredan.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tableros', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('nombre', 40);
            $table->boolean('es_principal')->default(true);
            // Solo en las carpetas: el tablero principal al que pertenecen. Al borrar el principal se van con él.
            $table->ulid('principal_id')->nullable()->index();
            $table->boolean('es_plantilla')->default(false);
            // La plantilla que trae la app y que usan los niños que aún no tienen tablero propio.
            $table->boolean('es_general')->default(false);
            // Copia propia de un niño: nace en su primera edición.
            $table->foreignUlid('estudiante_id')->nullable()->index()->constrained('estudiantes')->cascadeOnDelete();
            $table->ulid('copiado_de_id')->nullable()->index();
            // Si al elegir una palabra dentro de una carpeta se vuelve solo al tablero principal.
            $table->boolean('volver_al_elegir')->default(true);
            $table->foreignUlid('creado_por')->nullable()->index()->constrained('usuarios')->nullOnDelete();
            $table->timestampsTz();
        });

        // Las claves hacia la propia tabla van aparte: dentro de la creación, Postgres aún no tiene la clave primaria.
        Schema::table('tableros', function (Blueprint $table) {
            $table->foreign('principal_id')->references('id')->on('tableros')->cascadeOnDelete();
            $table->foreign('copiado_de_id')->references('id')->on('tableros')->nullOnDelete();
        });

        DB::statement("ALTER TABLE tableros ADD CONSTRAINT tableros_nombre_no_vacio CHECK (btrim(nombre) <> '')");
        // Una carpeta (con principal_id) no es principal, y al revés.
        DB::statement('ALTER TABLE tableros ADD CONSTRAINT tableros_principal_segun_carpeta CHECK (es_principal = (principal_id IS NULL))');
        // Un principal es una plantilla o la copia de un niño, nunca las dos cosas ni ninguna.
        DB::statement('ALTER TABLE tableros ADD CONSTRAINT tableros_dueno_del_principal CHECK (NOT es_principal OR (es_plantilla <> (estudiante_id IS NOT NULL)))');
        // Las carpetas no tienen dueño propio: lo heredan de su principal.
        DB::statement('ALTER TABLE tableros ADD CONSTRAINT tableros_carpeta_sin_dueno CHECK (es_principal OR (NOT es_plantilla AND NOT es_general AND estudiante_id IS NULL))');
        DB::statement('ALTER TABLE tableros ADD CONSTRAINT tableros_general_es_plantilla_principal CHECK (NOT es_general OR (es_plantilla AND es_principal))');

        // Un niño tiene a lo más un tablero propio, y hay una sola plantilla general.
        DB::statement('CREATE UNIQUE INDEX tableros_un_principal_por_estudiante ON tableros (estudiante_id) WHERE es_principal AND estudiante_id IS NOT NULL');
        DB::statement('CREATE UNIQUE INDEX tableros_una_plantilla_general ON tableros (es_general) WHERE es_general');

        // Un solo nivel de carpetas: una carpeta no puede estar dentro de otra.
        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION validar_tablero() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN
                IF NEW.principal_id IS NOT NULL THEN
                    IF EXISTS (SELECT 1 FROM tableros WHERE id = NEW.principal_id AND principal_id IS NOT NULL) THEN
                        RAISE EXCEPTION 'Una carpeta no puede estar dentro de otra carpeta';
                    END IF;
                    IF EXISTS (SELECT 1 FROM tableros WHERE principal_id = NEW.id) THEN
                        RAISE EXCEPTION 'Un tablero con carpetas no puede volverse una carpeta';
                    END IF;
                END IF;

                RETURN NEW;
            END;
            $$;
        SQL);
        DB::statement('CREATE TRIGGER tableros_validar BEFORE INSERT OR UPDATE ON tableros FOR EACH ROW EXECUTE FUNCTION validar_tablero()');
    }

    public function down(): void
    {
        Schema::dropIfExists('tableros');
        DB::statement('DROP FUNCTION IF EXISTS validar_tablero()');
    }
};
