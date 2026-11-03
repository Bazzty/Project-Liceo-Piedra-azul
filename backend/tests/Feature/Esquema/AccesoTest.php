<?php

namespace Tests\Feature\Esquema;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class AccesoTest extends EsquemaTestCase
{
    public function test_el_correo_se_guarda_en_minusculas_y_no_se_repite(): void
    {
        $this->assertRechaza('usuarios_email_minusculas', fn () => $this->usuario(datos: ['email' => 'Ana@Prueba.cl']));

        $this->usuario(datos: ['email' => 'ana@prueba.cl']);
        $this->assertRechaza('usuarios_email_unique', fn () => $this->usuario(datos: ['email' => 'ana@prueba.cl']));
    }

    public function test_el_modelo_baja_el_correo_a_minusculas(): void
    {
        $usuario = User::factory()->create(['email' => '  Ana@Prueba.CL ']);

        $this->assertSame('ana@prueba.cl', $usuario->fresh()->email);
    }

    public function test_las_sesiones_web_se_cierran_al_borrar_al_usuario(): void
    {
        $usuario = $this->usuario();
        DB::table('sessions')->insert(['id' => 'sesion-prueba', 'user_id' => $usuario, 'payload' => '', 'last_activity' => time()]);

        DB::table('usuarios')->where('id', $usuario)->delete();

        $this->assertDatabaseMissing('sessions', ['id' => 'sesion-prueba']);
    }

    public function test_el_rol_es_uno_de_los_permitidos(): void
    {
        $this->assertRechaza('usuarios_rol_check', fn () => $this->usuario('apoderado'));
    }

    public function test_no_se_borra_una_docente_que_tiene_cursos(): void
    {
        $docente = $this->usuario();
        $this->curso(['docente_id' => $docente]);

        $this->assertRechaza('cursos_docente_id_foreign', fn () => DB::table('usuarios')->where('id', $docente)->delete());
    }

    public function test_un_curso_no_se_repite_en_el_mismo_anio(): void
    {
        $this->curso(['nombre' => 'Kinder A', 'anio' => 2026]);
        $this->curso(['nombre' => 'Kinder A', 'anio' => 2027]);

        $this->assertRechaza('cursos_nombre_anio_unique', fn () => $this->curso(['nombre' => 'Kinder A', 'anio' => 2026]));
        $this->assertRechaza('cursos_anio_valido', fn () => $this->curso(['anio' => 26]));
    }

    public function test_no_se_borra_un_curso_con_estudiantes(): void
    {
        $curso = $this->curso();
        $this->estudiante(['curso_id' => $curso]);

        $this->assertRechaza('estudiantes_curso_id_foreign', fn () => DB::table('cursos')->where('id', $curso)->delete());
    }

    public function test_el_codigo_de_acceso_no_se_repite(): void
    {
        $hash = str_repeat('a', 64);
        $this->estudiante(['codigo_acceso_hash' => $hash]);

        $this->assertRechaza('estudiantes_codigo_acceso_hash_unique', fn () => $this->estudiante(['codigo_acceso_hash' => $hash]));
    }

    public function test_datos_del_estudiante_validos(): void
    {
        $this->assertRechaza('estudiantes_nombre_no_vacio', fn () => $this->estudiante(['nombre' => '  ']));
        $this->assertRechaza('estudiantes_inicial_mayuscula', fn () => $this->estudiante(['inicial_apellido' => 'p']));
        $this->assertRechaza('estudiantes_tema_visual_check', fn () => $this->estudiante(['tema_visual' => 'neon']));
        $this->assertRechaza('estudiantes_intentos_no_negativos', fn () => $this->estudiante(['intentos_fallidos' => -1]));
    }

    public function test_cada_apoyo_va_una_vez_y_se_va_con_el_estudiante(): void
    {
        $estudiante = $this->estudiante();
        DB::table('estudiante_apoyos')->insert(['estudiante_id' => $estudiante, 'apoyo' => 'barrido']);

        $this->assertRechaza('estudiante_apoyos_pkey', fn () => DB::table('estudiante_apoyos')->insert(['estudiante_id' => $estudiante, 'apoyo' => 'barrido']));
        $this->assertRechaza('estudiante_apoyos_apoyo_check', fn () => DB::table('estudiante_apoyos')->insert(['estudiante_id' => $estudiante, 'apoyo' => 'volar']));

        DB::table('estudiantes')->where('id', $estudiante)->delete();
        $this->assertSame(0, DB::table('estudiante_apoyos')->count());
    }

    public function test_un_curso_no_tiene_dos_sesiones_de_aula_a_la_vez(): void
    {
        $curso = $this->curso();
        $this->sesionAula($curso, '2026-11-02 10:00-03', '2026-11-02 11:30-03');

        $this->assertRechaza('sesiones_aula_sin_superponer', fn () => $this->sesionAula($curso, '2026-11-02 11:00-03', '2026-11-02 12:30-03'));

        // Al terminar una, empieza la siguiente; y otro curso puede tener la suya al mismo tiempo.
        $this->sesionAula($curso, '2026-11-02 11:30-03', '2026-11-02 13:00-03');
        $this->sesionAula($this->curso(), '2026-11-02 10:00-03', '2026-11-02 11:30-03');
        $this->assertSame(3, DB::table('sesiones_aula')->count());
    }

    public function test_cerrar_una_sesion_libera_el_horario(): void
    {
        $curso = $this->curso();
        $this->sesionAula($curso, '2026-11-02 10:00-03', '2026-11-02 11:30-03', ['cerrada_at' => '2026-11-02 10:20-03']);

        $this->sesionAula($curso, '2026-11-02 10:30-03', '2026-11-02 12:00-03');
        $this->assertSame(2, DB::table('sesiones_aula')->count());
    }

    public function test_las_horas_y_la_agenda_de_la_sesion_tienen_sentido(): void
    {
        $curso = $this->curso();

        $this->assertRechaza('sesiones_aula_expira_despues', fn () => $this->sesionAula($curso, '2026-11-02 10:00-03', '2026-11-02 09:00-03'));
        $this->assertRechaza('sesiones_aula_agenda_distinta', fn () => $this->sesionAula($curso, '2026-11-02 10:00-03', '2026-11-02 11:00-03', ['agenda_despues' => 'leer']));
    }

    public function test_la_auditoria_no_se_edita_ni_se_borra(): void
    {
        $this->assertRechaza('audit_logs_con_responsable', fn () => $this->fila('audit_logs', ['accion' => 'entrar_como']));

        $id = $this->fila('audit_logs', ['usuario_id' => $this->usuario(), 'estudiante_id' => $this->estudiante(), 'accion' => 'entrar_como', 'ip' => '127.0.0.1']);

        $this->assertRechaza('solo inserción', fn () => DB::table('audit_logs')->where('id', $id)->update(['accion' => 'otra']));
        $this->assertRechaza('solo inserción', fn () => DB::table('audit_logs')->where('id', $id)->delete());
    }
}
