<?php

namespace Tests\Feature\Esquema;

use Illuminate\Support\Facades\DB;

class ContenidoTest extends EsquemaTestCase
{
    public function test_todo_pictograma_lleva_texto_alternativo(): void
    {
        $this->assertRechaza('pictogramas_alt_text_no_vacio', fn () => $this->pictograma(['alt_text' => ' ']));
        $this->assertRechaza('not-null', fn () => $this->pictograma(['alt_text' => null]));
    }

    public function test_solo_los_de_arasaac_llevan_su_numero_y_no_se_repite(): void
    {
        $this->assertRechaza('pictogramas_arasaac_id_segun_origen', fn () => $this->pictograma(['origen' => 'arasaac']));
        $this->assertRechaza('pictogramas_arasaac_id_segun_origen', fn () => $this->pictograma(['origen' => 'foto', 'arasaac_id' => 2462]));

        $this->pictograma(['origen' => 'arasaac', 'arasaac_id' => 2462]);
        $this->assertRechaza('pictogramas_arasaac_id_unique', fn () => $this->pictograma(['origen' => 'arasaac', 'arasaac_id' => 2462]));
    }

    public function test_no_se_borra_un_pictograma_usado_en_un_cuento(): void
    {
        $pictograma = $this->pictograma();
        $pagina = $this->fila('cuento_paginas', ['cuento_id' => $this->cuento(), 'numero' => 1, 'texto' => 'Ana sube al auto.']);
        $this->fila('pagina_palabras', ['pagina_id' => $pagina, 'orden' => 1, 'texto' => 'auto', 'pictograma_id' => $pictograma]);

        $this->assertRechaza('pagina_palabras_pictograma_id_foreign', fn () => DB::table('pictogramas')->where('id', $pictograma)->delete());
    }

    public function test_temas_sin_duplicados_aunque_cambien_mayusculas(): void
    {
        $this->fila('temas', ['nombre' => 'Animales']);

        $this->assertRechaza('temas_nombre_unique', fn () => $this->fila('temas', ['nombre' => 'animales']));
    }

    public function test_un_cuento_nace_en_borrador(): void
    {
        $this->assertRechaza('empieza en borrador', fn () => $this->cuento(['estado' => 'publicado']));

        $id = $this->cuento();
        $this->assertSame('borrador', DB::table('cuentos')->where('id', $id)->value('estado'));
    }

    public function test_el_estado_solo_cambia_con_una_validacion(): void
    {
        $id = $this->cuento();

        $this->assertRechaza('solo cambia registrando una validación', fn () => DB::table('cuentos')->where('id', $id)->update(['estado' => 'publicado']));

        $this->validar($id, 'borrador', 'en_revision');
        $this->validar($id, 'en_revision', 'publicado');

        $this->assertSame('publicado', DB::table('cuentos')->where('id', $id)->value('estado'));
        $this->assertSame(2, DB::table('validaciones')->where('cuento_id', $id)->count());
    }

    public function test_editar_otros_datos_del_cuento_no_toca_el_estado(): void
    {
        $id = $this->cuento();

        DB::table('cuentos')->where('id', $id)->update(['titulo' => 'Ana y su auto']);

        $this->assertSame('Ana y su auto', DB::table('cuentos')->where('id', $id)->value('titulo'));
    }

    public function test_las_validaciones_siguen_el_flujo(): void
    {
        $id = $this->cuento();

        // Saltarse la revisión.
        $this->assertRechaza('validaciones_transicion_valida', fn () => $this->validar($id, 'borrador', 'publicado'));
        // Decir que viene de un estado en el que no está.
        $this->assertRechaza('no está en estado en_revision', fn () => $this->validar($id, 'en_revision', 'publicado'));

        $this->validar($id, 'borrador', 'en_revision');
        // Devolver sin decir por qué.
        $this->assertRechaza('validaciones_devolucion_con_observacion', fn () => $this->validar($id, 'en_revision', 'borrador'));

        $this->validar($id, 'en_revision', 'borrador', 'Falta el pictograma de «sube».');
        $this->assertSame('borrador', DB::table('cuentos')->where('id', $id)->value('estado'));
    }

    public function test_el_acta_de_validacion_no_se_edita_ni_se_borra(): void
    {
        $id = $this->cuento();
        $this->validar($id, 'borrador', 'en_revision');

        $this->assertRechaza('solo inserción', fn () => DB::table('validaciones')->update(['observacion' => 'cambiada']));
        $this->assertRechaza('solo inserción', fn () => DB::table('validaciones')->delete());
        $this->assertRechaza('validaciones_cuento_id_foreign', fn () => DB::table('cuentos')->where('id', $id)->delete());
    }

    public function test_paginas_y_palabras_no_repiten_posicion(): void
    {
        $cuento = $this->cuento();
        $pagina = $this->fila('cuento_paginas', ['cuento_id' => $cuento, 'numero' => 1, 'texto' => 'Ana sube.']);
        $this->fila('pagina_palabras', ['pagina_id' => $pagina, 'orden' => 1, 'texto' => 'Ana']);

        $this->assertRechaza('cuento_paginas_cuento_id_numero_unique', fn () => $this->fila('cuento_paginas', ['cuento_id' => $cuento, 'numero' => 1, 'texto' => 'Otra.']));
        $this->assertRechaza('cuento_paginas_numero_positivo', fn () => $this->fila('cuento_paginas', ['cuento_id' => $cuento, 'numero' => 0, 'texto' => 'Otra.']));
        $this->assertRechaza('pagina_palabras_pagina_id_orden_unique', fn () => $this->fila('pagina_palabras', ['pagina_id' => $pagina, 'orden' => 1, 'texto' => 'sube']));
    }

    public function test_se_pueden_reordenar_paginas_dentro_de_una_transaccion(): void
    {
        $cuento = $this->cuento();
        $uno = $this->fila('cuento_paginas', ['cuento_id' => $cuento, 'numero' => 1, 'texto' => 'Primera.']);
        $dos = $this->fila('cuento_paginas', ['cuento_id' => $cuento, 'numero' => 2, 'texto' => 'Segunda.']);

        DB::transaction(function () use ($uno, $dos) {
            DB::statement('SET CONSTRAINTS cuento_paginas_cuento_id_numero_unique DEFERRED');
            DB::table('cuento_paginas')->where('id', $uno)->update(['numero' => 2]);
            DB::table('cuento_paginas')->where('id', $dos)->update(['numero' => 1]);
        });

        $this->assertSame(1, DB::table('cuento_paginas')->where('id', $dos)->value('numero'));
    }

    public function test_imagenes_de_portada_y_pagina_llevan_texto_alternativo(): void
    {
        $this->assertRechaza('cuentos_portada_con_alt', fn () => $this->cuento(['portada_path' => 'portadas/ana.webp']));
        $this->assertRechaza('cuento_paginas_imagen_con_alt', fn () => $this->fila('cuento_paginas', [
            'cuento_id' => $this->cuento(), 'numero' => 1, 'texto' => 'Ana.', 'imagen_path' => 'paginas/1.webp',
        ]));
    }

    public function test_borrar_una_pagina_borra_sus_palabras_y_silabas_pero_no_el_catalogo(): void
    {
        $pagina = $this->fila('cuento_paginas', ['cuento_id' => $this->cuento(), 'numero' => 1, 'texto' => 'Mamá.']);
        $palabra = $this->fila('pagina_palabras', ['pagina_id' => $pagina, 'orden' => 1, 'texto' => 'Mamá']);
        $ma = $this->fila('silabas', ['texto' => 'ma']);
        $maTilde = $this->fila('silabas', ['texto' => 'má']);
        DB::table('palabra_silabas')->insert([
            ['palabra_id' => $palabra, 'orden' => 1, 'silaba_id' => $ma],
            ['palabra_id' => $palabra, 'orden' => 2, 'silaba_id' => $maTilde],
        ]);

        $this->assertRechaza('silabas_texto_unique', fn () => $this->fila('silabas', ['texto' => 'ma']));
        $this->assertRechaza('silabas_texto_minusculas', fn () => $this->fila('silabas', ['texto' => 'Pa']));

        DB::table('cuento_paginas')->where('id', $pagina)->delete();

        $this->assertSame(0, DB::table('pagina_palabras')->count());
        $this->assertSame(0, DB::table('palabra_silabas')->count());
        $this->assertSame(2, DB::table('silabas')->count());
    }
}
