<?php

namespace Tests\Feature\Esquema;

use Illuminate\Support\Facades\DB;

class SeguimientoTest extends EsquemaTestCase
{
    public function test_una_tarea_no_se_asigna_a_un_nino_de_otro_curso(): void
    {
        $curso = $this->curso();
        $tarea = $this->fila('tareas', ['curso_id' => $curso, 'cuento_id' => $this->cuento(), 'creada_por' => $this->usuario(), 'para_todo_el_curso' => false]);
        $delCurso = $this->estudiante(['curso_id' => $curso]);
        $deOtro = $this->estudiante();

        DB::table('tarea_estudiante')->insert(['tarea_id' => $tarea, 'estudiante_id' => $delCurso, 'curso_id' => $curso]);

        // Ni declarando el curso de la tarea (el niño no es de ahí)…
        $this->assertRechaza('tarea_estudiante_estudiante_id_curso_id_foreign', fn () => DB::table('tarea_estudiante')->insert(['tarea_id' => $tarea, 'estudiante_id' => $deOtro, 'curso_id' => $curso]));
        // …ni declarando el curso del niño (la tarea no es de ahí).
        $otroCurso = DB::table('estudiantes')->where('id', $deOtro)->value('curso_id');
        $this->assertRechaza('tarea_estudiante_tarea_id_curso_id_foreign', fn () => DB::table('tarea_estudiante')->insert(['tarea_id' => $tarea, 'estudiante_id' => $deOtro, 'curso_id' => $otroCurso]));
    }

    public function test_borrar_una_tarea_borra_sus_asignaciones(): void
    {
        $curso = $this->curso();
        $tarea = $this->fila('tareas', ['curso_id' => $curso, 'cuento_id' => $this->cuento(), 'creada_por' => $this->usuario(), 'para_todo_el_curso' => false]);
        DB::table('tarea_estudiante')->insert(['tarea_id' => $tarea, 'estudiante_id' => $this->estudiante(['curso_id' => $curso]), 'curso_id' => $curso]);

        DB::table('tareas')->where('id', $tarea)->delete();

        $this->assertSame(0, DB::table('tarea_estudiante')->count());
    }

    public function test_un_solo_progreso_por_nino_y_cuento(): void
    {
        $estudiante = $this->estudiante();
        $cuento = $this->cuento();
        $this->fila('progresos', ['estudiante_id' => $estudiante, 'cuento_id' => $cuento, 'pagina_actual' => 1]);

        $this->assertRechaza('progresos_estudiante_id_cuento_id_unique', fn () => $this->fila('progresos', ['estudiante_id' => $estudiante, 'cuento_id' => $cuento]));
        $this->assertRechaza('progresos_pagina_positiva', fn () => $this->fila('progresos', ['estudiante_id' => $estudiante, 'cuento_id' => $this->cuento(), 'pagina_actual' => 0]));
    }

    public function test_en_el_liceo_se_entra_con_sesion_de_aula_y_en_casa_sin_ella(): void
    {
        $curso = $this->curso();
        $estudiante = $this->estudiante(['curso_id' => $curso]);
        $sesion = $this->sesionAula($curso, '2026-11-02 10:00-03', '2026-11-02 11:30-03');

        $this->assertRechaza('ingresos_sesion_segun_lugar', fn () => $this->fila('ingresos', ['estudiante_id' => $estudiante, 'lugar' => 'liceo']));
        $this->assertRechaza('ingresos_sesion_segun_lugar', fn () => $this->fila('ingresos', ['estudiante_id' => $estudiante, 'lugar' => 'casa', 'sesion_aula_id' => $sesion]));

        $this->fila('ingresos', ['estudiante_id' => $estudiante, 'lugar' => 'liceo', 'sesion_aula_id' => $sesion]);
        $this->ingresoEnCasa($estudiante);
        $this->assertSame(2, DB::table('ingresos')->count());
    }

    public function test_en_el_liceo_se_entra_solo_con_una_sesion_del_propio_curso(): void
    {
        $curso = $this->curso();
        $otroCurso = $this->curso();
        $estudiante = $this->estudiante(['curso_id' => $curso]);
        $sesionAjena = $this->sesionAula($otroCurso, '2026-11-02 10:00-03', '2026-11-02 11:30-03');

        $this->assertRechaza('ingresos_sesion_del_curso', fn () => $this->fila('ingresos', ['estudiante_id' => $estudiante, 'lugar' => 'liceo', 'sesion_aula_id' => $sesionAjena]));

        // Cambiarse de curso no invalida los ingresos que ya tenía.
        $sesionPropia = $this->sesionAula($curso, '2026-11-02 10:00-03', '2026-11-02 11:30-03');
        $this->fila('ingresos', ['estudiante_id' => $estudiante, 'lugar' => 'liceo', 'sesion_aula_id' => $sesionPropia]);
        DB::table('estudiantes')->where('id', $estudiante)->update(['curso_id' => $otroCurso]);

        $this->assertSame(1, DB::table('ingresos')->where('estudiante_id', $estudiante)->count());
    }

    public function test_los_numeros_del_juego_tienen_sentido(): void
    {
        $ingreso = $this->ingresoEnCasa($this->estudiante());
        $cuento = $this->cuento();

        $this->assertRechaza('sesiones_juego_aciertos_validos', fn () => $this->fila('sesiones_juego', ['ingreso_id' => $ingreso, 'cuento_id' => $cuento, 'aciertos' => 5, 'total' => 4]));
        $this->assertRechaza('sesiones_juego_aciertos_validos', fn () => $this->fila('sesiones_juego', ['ingreso_id' => $ingreso, 'cuento_id' => $cuento, 'aciertos' => 0, 'total' => 0]));
        $this->assertRechaza('lecturas_palabras_no_negativas', fn () => $this->fila('lecturas', ['ingreso_id' => $ingreso, 'cuento_id' => $cuento, 'pagina_hasta' => 1, 'palabras_escuchadas' => -3]));
        $this->assertRechaza('momentos_calma_animo_check', fn () => $this->fila('momentos_calma', ['ingreso_id' => $ingreso, 'segundos' => 60, 'animo' => 'feliz']));
    }

    public function test_borrar_un_estudiante_borra_todo_su_seguimiento(): void
    {
        $estudiante = $this->estudiante();
        $cuento = $this->cuento();
        $ingreso = $this->ingresoEnCasa($estudiante);

        $this->fila('progresos', ['estudiante_id' => $estudiante, 'cuento_id' => $cuento]);
        $this->fila('lecturas', ['ingreso_id' => $ingreso, 'cuento_id' => $cuento, 'pagina_hasta' => 2]);
        $juego = $this->fila('sesiones_juego', ['ingreso_id' => $ingreso, 'cuento_id' => $cuento, 'aciertos' => 3, 'total' => 4]);
        DB::table('juego_palabras_dificiles')->insert(['sesion_juego_id' => $juego, 'palabra' => 'sube']);
        $calma = $this->fila('momentos_calma', ['ingreso_id' => $ingreso, 'segundos' => 90, 'animo' => 'mejor']);
        DB::table('calma_actividades')->insert(['momento_calma_id' => $calma, 'actividad' => 'respirar']);
        $tablero = $this->fila('usos_tablero', ['ingreso_id' => $ingreso]);
        DB::table('uso_tablero_pictogramas')->insert(['uso_tablero_id' => $tablero, 'orden' => 1, 'pictograma_id' => $this->pictograma()]);

        DB::table('estudiantes')->where('id', $estudiante)->delete();

        foreach (['progresos', 'ingresos', 'lecturas', 'sesiones_juego', 'juego_palabras_dificiles', 'momentos_calma', 'calma_actividades', 'usos_tablero', 'uso_tablero_pictogramas'] as $tabla) {
            $this->assertSame(0, DB::table($tabla)->count(), "Quedaron filas en {$tabla}");
        }
        // El contenido no es del niño: se queda.
        $this->assertSame(1, DB::table('cuentos')->count());
        $this->assertSame(1, DB::table('pictogramas')->count());
    }

    public function test_no_se_borra_un_cuento_que_alguien_leyo(): void
    {
        $cuento = $this->cuento();
        $this->fila('lecturas', ['ingreso_id' => $this->ingresoEnCasa($this->estudiante()), 'cuento_id' => $cuento, 'pagina_hasta' => 1]);

        $this->assertRechaza('lecturas_cuento_id_foreign', fn () => DB::table('cuentos')->where('id', $cuento)->delete());
    }
}
