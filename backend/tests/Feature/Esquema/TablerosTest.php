<?php

namespace Tests\Feature\Esquema;

use Illuminate\Support\Facades\DB;

/** Tableros de comunicación (PLPA-109): la base misma exige las reglas del modelo. */
class TablerosTest extends EsquemaTestCase
{
    private function plantilla(array $datos = []): string
    {
        return $this->fila('tableros', ['nombre' => 'Plantilla', 'es_plantilla' => true, ...$datos]);
    }

    private function carpeta(string $principalId, array $datos = []): string
    {
        return $this->fila('tableros', ['nombre' => 'Comida', 'es_principal' => false, 'principal_id' => $principalId, ...$datos]);
    }

    private function palabra(string $tableroId, int $orden = 1, array $datos = []): string
    {
        return $this->fila('tablero_celdas', [
            'tablero_id' => $tableroId,
            'orden' => $orden,
            'tipo' => 'palabra',
            'pictograma_id' => $datos['pictograma_id'] ?? $this->pictograma(),
            'texto_mostrado' => 'agua',
            'categoria_id' => $datos['categoria_id'] ?? $this->categoria(),
            ...$datos,
        ]);
    }

    private function celdaCarpeta(string $principalId, string $carpetaId, int $orden = 1): string
    {
        return $this->fila('tablero_celdas', [
            'tablero_id' => $principalId,
            'orden' => $orden,
            'tipo' => 'carpeta',
            'texto_mostrado' => 'Comida',
            'categoria_id' => $this->categoria(),
            'destino_tablero_id' => $carpetaId,
        ]);
    }

    public function test_un_principal_es_una_plantilla_o_la_copia_de_un_nino_pero_no_ambas_ni_ninguna(): void
    {
        $this->plantilla();
        $this->fila('tableros', ['nombre' => 'De Ana', 'estudiante_id' => $this->estudiante()]);

        $this->assertRechaza('tableros_dueno_del_principal', fn () => $this->fila('tableros', ['nombre' => 'Huérfano']));
        $this->assertRechaza('tableros_dueno_del_principal', fn () => $this->plantilla(['estudiante_id' => $this->estudiante()]));
    }

    public function test_cada_nino_tiene_un_solo_tablero_propio_y_hay_una_sola_plantilla_general(): void
    {
        $nino = $this->estudiante();
        $this->fila('tableros', ['nombre' => 'De Ana', 'estudiante_id' => $nino]);
        $this->assertRechaza('tableros_un_principal_por_estudiante', fn () => $this->fila('tableros', ['nombre' => 'Otro', 'estudiante_id' => $nino]));

        $this->plantilla(['es_general' => true]);
        $this->assertRechaza('tableros_una_plantilla_general', fn () => $this->plantilla(['es_general' => true]));
        $this->assertRechaza('tableros_general_es_plantilla_principal', fn () => $this->fila('tableros', ['nombre' => 'X', 'estudiante_id' => $this->estudiante(), 'es_general' => true]));
    }

    public function test_una_carpeta_hereda_el_dueno_y_solo_hay_un_nivel(): void
    {
        $principal = $this->plantilla();
        $carpeta = $this->carpeta($principal);

        $this->assertRechaza('tableros_principal_segun_carpeta', fn () => $this->fila('tableros', ['nombre' => 'X', 'es_principal' => true, 'principal_id' => $principal, 'es_plantilla' => true]));
        $this->assertRechaza('tableros_carpeta_sin_dueno', fn () => $this->carpeta($principal, ['es_plantilla' => true]));
        $this->assertRechaza('no puede estar dentro de otra carpeta', fn () => $this->carpeta($carpeta));
        $this->assertRechaza('no puede volverse una carpeta', fn () => DB::table('tableros')->where('id', $principal)->update(['es_principal' => false, 'principal_id' => $this->plantilla()]));
    }

    public function test_una_palabra_lleva_su_dibujo_y_una_carpeta_abre_un_tablero(): void
    {
        $principal = $this->plantilla();
        $carpeta = $this->carpeta($principal);
        $categoria = $this->categoria();
        $base = ['tablero_id' => $principal, 'orden' => 1, 'texto_mostrado' => 'x', 'categoria_id' => $categoria];

        $this->assertRechaza('tablero_celdas_segun_tipo', fn () => $this->fila('tablero_celdas', [...$base, 'tipo' => 'palabra']));
        $this->assertRechaza('tablero_celdas_segun_tipo', fn () => $this->fila('tablero_celdas', [...$base, 'tipo' => 'carpeta']));
        $this->assertRechaza('tablero_celdas_segun_tipo', fn () => $this->fila('tablero_celdas', [...$base, 'tipo' => 'palabra', 'pictograma_id' => $this->pictograma(), 'destino_tablero_id' => $carpeta]));
        $this->assertRechaza('tablero_celdas_nucleo_solo_palabra', fn () => $this->fila('tablero_celdas', [...$base, 'tipo' => 'carpeta', 'destino_tablero_id' => $carpeta, 'es_nucleo' => true]));
        $this->assertRechaza('tablero_celdas_texto_no_vacio', fn () => $this->palabra($principal, 2, ['texto_mostrado' => ' ']));
        $this->assertRechaza('tablero_celdas_audio_con_texto', fn () => $this->palabra($principal, 3, ['audio_path' => 'audio-generado/x.mp3']));
    }

    public function test_las_carpetas_solo_van_en_el_principal_y_abren_un_tablero_suyo(): void
    {
        $principal = $this->plantilla();
        $carpeta = $this->carpeta($principal);
        $ajena = $this->carpeta($this->plantilla());

        $this->assertRechaza('Las carpetas solo van en el tablero principal', fn () => $this->celdaCarpeta($carpeta, $this->carpeta($principal)));
        $this->assertRechaza('debe abrir un tablero que sea suyo', fn () => $this->celdaCarpeta($principal, $ajena));
        $this->assertRechaza('debe abrir un tablero que sea suyo', fn () => $this->celdaCarpeta($principal, $principal));

        $this->celdaCarpeta($principal, $carpeta);
        $this->assertRechaza('tablero_celdas_destino_unico', fn () => $this->celdaCarpeta($principal, $carpeta, 2));
    }

    public function test_las_palabras_siempre_a_la_vista_solo_van_en_el_principal(): void
    {
        $principal = $this->plantilla();
        $carpeta = $this->carpeta($principal);

        $this->palabra($principal, 1, ['es_nucleo' => true]);
        $this->assertRechaza('solo van en el tablero principal', fn () => $this->palabra($carpeta, 1, ['es_nucleo' => true]));
    }

    public function test_el_orden_de_las_celdas_no_se_repite_pero_se_puede_intercambiar_dentro_de_una_transaccion(): void
    {
        $tablero = $this->plantilla();
        $a = $this->palabra($tablero, 1);
        $b = $this->palabra($tablero, 2);

        $this->assertRechaza('tablero_celdas_tablero_id_orden_unique', fn () => $this->palabra($tablero, 2));
        $this->assertRechaza('tablero_celdas_orden_positivo', fn () => $this->palabra($tablero, 0));

        DB::transaction(function () use ($a, $b) {
            DB::statement('SET CONSTRAINTS tablero_celdas_tablero_id_orden_unique DEFERRED');
            DB::table('tablero_celdas')->where('id', $a)->update(['orden' => 2]);
            DB::table('tablero_celdas')->where('id', $b)->update(['orden' => 1]);
        });

        $this->assertSame(2, DB::table('tablero_celdas')->where('id', $a)->value('orden'));
        $this->assertSame(1, DB::table('tablero_celdas')->where('id', $b)->value('orden'));
    }

    public function test_no_se_borra_un_pictograma_ni_una_categoria_que_un_tablero_usa(): void
    {
        $tablero = $this->plantilla();
        $pictograma = $this->pictograma();
        $categoria = $this->categoria();
        $this->palabra($tablero, 1, ['pictograma_id' => $pictograma, 'categoria_id' => $categoria]);

        $this->assertRechaza('tablero_celdas_pictograma_id_foreign', fn () => DB::table('pictogramas')->where('id', $pictograma)->delete());
        $this->assertRechaza('tablero_celdas_categoria_id_foreign', fn () => DB::table('categorias_pictograma')->where('id', $categoria)->delete());
    }

    public function test_borrar_un_tablero_se_lleva_lo_que_depende_de_el(): void
    {
        $principal = $this->plantilla();
        $carpeta = $this->carpeta($principal);
        $celda = $this->celdaCarpeta($principal, $carpeta);
        $this->palabra($carpeta);

        // Quitar solo la carpeta quita la celda que la abría
        DB::table('tableros')->where('id', $carpeta)->delete();
        $this->assertNull(DB::table('tablero_celdas')->where('id', $celda)->first());
        $this->assertSame(0, DB::table('tablero_celdas')->where('tablero_id', $carpeta)->count());

        // Quitar el principal quita sus carpetas y todas las celdas
        $otraCarpeta = $this->carpeta($principal, ['nombre' => 'Juegos']);
        $this->celdaCarpeta($principal, $otraCarpeta);
        $this->palabra($otraCarpeta);
        DB::table('tableros')->where('id', $principal)->delete();
        $this->assertSame(0, DB::table('tableros')->count());
        $this->assertSame(0, DB::table('tablero_celdas')->count());
    }

    public function test_borrar_al_nino_borra_su_tablero_y_borrar_el_original_solo_suelta_la_referencia_de_la_copia(): void
    {
        $original = $this->plantilla();
        $nino = $this->estudiante();
        $copia = $this->fila('tableros', ['nombre' => 'De Ana', 'estudiante_id' => $nino, 'copiado_de_id' => $original]);

        DB::table('tableros')->where('id', $original)->delete();
        $this->assertNull(DB::table('tableros')->where('id', $copia)->value('copiado_de_id'));
        $this->assertNotNull(DB::table('tableros')->where('id', $copia)->first());

        DB::table('estudiantes')->where('id', $nino)->delete();
        $this->assertNull(DB::table('tableros')->where('id', $copia)->first());
    }

    public function test_el_color_de_una_categoria_sale_de_la_paleta_y_su_orden_se_puede_intercambiar(): void
    {
        $this->assertRechaza('categorias_pictograma_color_valido', fn () => $this->fila('categorias_pictograma', ['clave' => 'x', 'nombre' => 'X', 'orden' => 1, 'color' => 'rosa']));

        $a = $this->fila('categorias_pictograma', ['clave' => 'a', 'nombre' => 'A', 'orden' => 1, 'color' => 'alerta']);
        $b = $this->fila('categorias_pictograma', ['clave' => 'b', 'nombre' => 'B', 'orden' => 2]);
        $this->assertSame('aprender', DB::table('categorias_pictograma')->where('id', $b)->value('color'));
        $this->assertRechaza('categorias_pictograma_orden_unique', fn () => DB::table('categorias_pictograma')->where('id', $b)->update(['orden' => 1]));

        DB::transaction(function () use ($a, $b) {
            DB::statement('SET CONSTRAINTS categorias_pictograma_orden_unique DEFERRED');
            DB::table('categorias_pictograma')->where('id', $a)->update(['orden' => 2]);
            DB::table('categorias_pictograma')->where('id', $b)->update(['orden' => 1]);
        });

        $this->assertSame(1, DB::table('categorias_pictograma')->where('id', $b)->value('orden'));
    }
}
