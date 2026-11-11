<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** Las celdas de un tablero (PLPA-109): una palabra con su dibujo, o una carpeta que abre otro tablero. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tablero_celdas', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('tablero_id')->index()->constrained('tableros')->cascadeOnDelete();
            $table->smallInteger('orden');
            $table->enum('tipo', ['palabra', 'carpeta']);
            // Como en pagina_palabras: un pictograma usado en un tablero no se borra, se desactiva.
            $table->foreignUlid('pictograma_id')->nullable()->index()->constrained('pictogramas')->restrictOnDelete();
            $table->string('texto_mostrado', 60);
            // Lo que se dice si es distinto de lo que se muestra («Agua» → «Quiero agua»).
            $table->string('texto_hablado', 120)->nullable();
            // Una categoría en uso no se puede borrar.
            $table->foreignUlid('categoria_id')->index()->constrained('categorias_pictograma')->restrictOnDelete();
            // Solo carpetas: el tablero que abre. Si ese tablero se borra, la celda se va con él.
            $table->foreignUlid('destino_tablero_id')->nullable()->constrained('tableros')->cascadeOnDelete();
            // Palabra de uso frecuente: se ve siempre, también dentro de las carpetas.
            $table->boolean('es_nucleo')->default(false);
            // Audio generado con la voz del proyecto y el texto para el que se generó: si el texto cambia, deja de valer.
            $table->string('audio_path')->nullable();
            $table->string('audio_texto', 120)->nullable();
            $table->timestampsTz();
        });

        // DEFERRABLE: al reordenar celdas dentro de una transacción la regla se revisa al confirmar.
        DB::statement('ALTER TABLE tablero_celdas ADD CONSTRAINT tablero_celdas_tablero_id_orden_unique UNIQUE (tablero_id, orden) DEFERRABLE INITIALLY IMMEDIATE');
        DB::statement('ALTER TABLE tablero_celdas ADD CONSTRAINT tablero_celdas_orden_positivo CHECK (orden > 0)');
        DB::statement("ALTER TABLE tablero_celdas ADD CONSTRAINT tablero_celdas_texto_no_vacio CHECK (btrim(texto_mostrado) <> '')");
        DB::statement("ALTER TABLE tablero_celdas ADD CONSTRAINT tablero_celdas_texto_hablado_no_vacio CHECK (texto_hablado IS NULL OR btrim(texto_hablado) <> '')");
        // Una palabra siempre lleva su dibujo; una carpeta siempre abre un tablero.
        DB::statement("ALTER TABLE tablero_celdas ADD CONSTRAINT tablero_celdas_segun_tipo CHECK ((tipo = 'palabra' AND pictograma_id IS NOT NULL AND destino_tablero_id IS NULL) OR (tipo = 'carpeta' AND destino_tablero_id IS NOT NULL))");
        DB::statement("ALTER TABLE tablero_celdas ADD CONSTRAINT tablero_celdas_nucleo_solo_palabra CHECK (NOT es_nucleo OR tipo = 'palabra')");
        DB::statement("ALTER TABLE tablero_celdas ADD CONSTRAINT tablero_celdas_audio_con_texto CHECK (audio_path IS NULL OR btrim(coalesce(audio_texto, '')) <> '')");
        // Cada carpeta tiene una sola celda que la abre.
        DB::statement('CREATE UNIQUE INDEX tablero_celdas_destino_unico ON tablero_celdas (destino_tablero_id) WHERE destino_tablero_id IS NOT NULL');

        // Reglas que dependen del tablero donde está la celda: la base las exige aunque el código de la app se equivoque.
        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION validar_celda_tablero() RETURNS trigger LANGUAGE plpgsql AS $$
            DECLARE
                dueno tableros%ROWTYPE;
                destino tableros%ROWTYPE;
            BEGIN
                SELECT * INTO dueno FROM tableros WHERE id = NEW.tablero_id;

                IF NEW.tipo = 'carpeta' THEN
                    IF NOT dueno.es_principal THEN
                        RAISE EXCEPTION 'Las carpetas solo van en el tablero principal';
                    END IF;
                    -- Sin destino lo rechaza tablero_celdas_segun_tipo; aquí solo se revisa que el destino sea suyo
                    IF NEW.destino_tablero_id IS NOT NULL THEN
                        SELECT * INTO destino FROM tableros WHERE id = NEW.destino_tablero_id;
                        IF destino.principal_id IS DISTINCT FROM NEW.tablero_id THEN
                            RAISE EXCEPTION 'Una carpeta debe abrir un tablero que sea suyo';
                        END IF;
                    END IF;
                END IF;

                IF NEW.es_nucleo AND NOT dueno.es_principal THEN
                    RAISE EXCEPTION 'Las palabras siempre a la vista solo van en el tablero principal';
                END IF;

                RETURN NEW;
            END;
            $$;
        SQL);
        DB::statement('CREATE TRIGGER tablero_celdas_validar BEFORE INSERT OR UPDATE ON tablero_celdas FOR EACH ROW EXECUTE FUNCTION validar_celda_tablero()');
    }

    public function down(): void
    {
        Schema::dropIfExists('tablero_celdas');
        DB::statement('DROP FUNCTION IF EXISTS validar_celda_tablero()');
    }
};
