<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Acta de cada cambio de estado de un cuento (RF-13). De ella sale también quién lo publicó y cuándo.
        Schema::create('validaciones', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('cuento_id')->index()->constrained('cuentos')->restrictOnDelete();
            $table->foreignUlid('usuario_id')->index()->constrained('usuarios')->restrictOnDelete();
            $table->enum('estado_anterior', ['borrador', 'en_revision', 'publicado', 'archivado']);
            $table->enum('estado_nuevo', ['borrador', 'en_revision', 'publicado', 'archivado']);
            $table->text('observacion')->nullable();
            $table->timestampTz('created_at')->useCurrent();
        });

        // Solo los pasos del flujo: enviar, devolver, publicar, archivar y volver a editar.
        DB::statement(<<<'SQL'
            ALTER TABLE validaciones ADD CONSTRAINT validaciones_transicion_valida CHECK (
                (estado_anterior, estado_nuevo) IN (
                    ('borrador', 'en_revision'),
                    ('en_revision', 'borrador'),
                    ('en_revision', 'publicado'),
                    ('publicado', 'archivado'),
                    ('publicado', 'borrador'),
                    ('archivado', 'borrador')
                )
            )
        SQL);
        // Si el revisor devuelve el cuento, tiene que decir por qué.
        DB::statement(<<<'SQL'
            ALTER TABLE validaciones ADD CONSTRAINT validaciones_devolucion_con_observacion CHECK (
                NOT (estado_anterior = 'en_revision' AND estado_nuevo = 'borrador')
                OR btrim(coalesce(observacion, '')) <> ''
            )
        SQL);

        DB::unprepared(<<<'SQL'
            CREATE TRIGGER validaciones_solo_insercion
            BEFORE UPDATE OR DELETE ON validaciones
            FOR EACH ROW EXECUTE FUNCTION impedir_cambios();

            -- Al registrar una validación se cambia el estado del cuento, si estaba en el estado anterior.
            CREATE OR REPLACE FUNCTION aplicar_validacion() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN
                UPDATE cuentos SET estado = NEW.estado_nuevo, updated_at = now()
                WHERE id = NEW.cuento_id AND estado = NEW.estado_anterior;
                IF NOT FOUND THEN
                    RAISE EXCEPTION 'El cuento % no está en estado %', NEW.cuento_id, NEW.estado_anterior;
                END IF;
                RETURN NEW;
            END;
            $$;

            CREATE TRIGGER validaciones_aplicar
            AFTER INSERT ON validaciones
            FOR EACH ROW EXECUTE FUNCTION aplicar_validacion();

            -- El estado de un cuento nace en borrador y solo cambia desde aplicar_validacion()
            -- (que corre dentro de otro trigger, por eso la profundidad es 2).
            CREATE OR REPLACE FUNCTION proteger_estado_cuento() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN
                IF TG_OP = 'INSERT' AND NEW.estado <> 'borrador' THEN
                    RAISE EXCEPTION 'Un cuento nuevo empieza en borrador';
                END IF;
                IF TG_OP = 'UPDATE' AND NEW.estado IS DISTINCT FROM OLD.estado AND pg_trigger_depth() < 2 THEN
                    RAISE EXCEPTION 'El estado de un cuento solo cambia registrando una validación';
                END IF;
                RETURN NEW;
            END;
            $$;

            CREATE TRIGGER cuentos_proteger_estado
            BEFORE INSERT OR UPDATE OF estado ON cuentos
            FOR EACH ROW EXECUTE FUNCTION proteger_estado_cuento();
        SQL);
    }

    public function down(): void
    {
        DB::statement('DROP TRIGGER IF EXISTS cuentos_proteger_estado ON cuentos');
        Schema::dropIfExists('validaciones');
        DB::statement('DROP FUNCTION IF EXISTS proteger_estado_cuento()');
        DB::statement('DROP FUNCTION IF EXISTS aplicar_validacion()');
    }
};
