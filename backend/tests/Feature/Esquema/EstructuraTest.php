<?php

namespace Tests\Feature\Esquema;

use Illuminate\Support\Facades\DB;

/** Reglas que debe cumplir toda tabla, también las que se agreguen después. */
class EstructuraTest extends EsquemaTestCase
{
    public function test_toda_tabla_tiene_clave_primaria(): void
    {
        $sinClave = DB::select(<<<'SQL'
            SELECT t.tablename
            FROM pg_tables t
            WHERE t.schemaname = current_schema()
              AND NOT EXISTS (
                  SELECT 1 FROM pg_constraint c
                  WHERE c.conrelid = (quote_ident(t.schemaname) || '.' || quote_ident(t.tablename))::regclass
                    AND c.contype = 'p'
              )
        SQL);

        $this->assertSame([], array_column($sinClave, 'tablename'));
    }

    /** Postgres no indexa solo las claves foráneas: sin índice, borrar o filtrar por el padre recorre toda la tabla. */
    public function test_toda_clave_foranea_tiene_indice(): void
    {
        $sinIndice = DB::select(<<<'SQL'
            SELECT c.conrelid::regclass::text AS tabla, c.conname
            FROM pg_constraint c
            WHERE c.contype = 'f'
              AND c.connamespace = current_schema()::regnamespace
              AND NOT EXISTS (
                  SELECT 1 FROM pg_index i
                  WHERE i.indrelid = c.conrelid
                    AND i.indkey[0] = c.conkey[1]
              )
        SQL);

        $this->assertSame([], array_column($sinIndice, 'conname'));
    }

    public function test_las_fechas_guardan_zona_horaria(): void
    {
        // Chile cambia de hora dos veces al año: una fecha sin zona queda ambigua.
        $sinZona = DB::select(<<<'SQL'
            SELECT table_name || '.' || column_name AS columna
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND data_type = 'timestamp without time zone'
              AND table_name NOT IN ('migrations', 'cache', 'cache_locks', 'jobs', 'job_batches', 'failed_jobs')
        SQL);

        $this->assertSame([], array_column($sinZona, 'columna'));
    }
}
