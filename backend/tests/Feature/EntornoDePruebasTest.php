<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

// Migra primero: sin esto el resultado dependería de si otro test ya creó el esquema.
uses(RefreshDatabase::class);

// El esquema usa cosas que SQLite no tiene (EXCLUDE con btree_gist, triggers en plpgsql, CHECK con
// expresiones): si los tests corrieran en SQLite pasarían sin probar nada de eso.
it('corre contra PostgreSQL 16 en una base de pruebas', function () {
    expect(DB::connection()->getDriverName())->toBe('pgsql')
        ->and(DB::connection()->getDatabaseName())->toEndWith('_test')
        ->and((int) DB::scalar('SHOW server_version_num'))->toBeGreaterThanOrEqual(160000);
});

it('las migraciones instalan las extensiones que pide el esquema', function () {
    expect(DB::table('pg_extension')->pluck('extname'))->toContain('btree_gist');
});
