<?php

namespace Tests\Feature\Esquema;

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Base para los tests del esquema: insertan filas directo con SQL (sin modelos) para comprobar
 * que la propia base rechaza los datos inválidos, aunque el código de la app tenga un error.
 */
abstract class EsquemaTestCase extends TestCase
{
    use RefreshDatabase;

    /** Comprueba que la base rechaza la operación y que lo hace por la regla esperada. */
    protected function assertRechaza(string $regla, callable $operacion): void
    {
        try {
            // Dentro de la transacción del test esto abre un savepoint: el error no aborta el resto.
            DB::transaction($operacion);
        } catch (QueryException $e) {
            $this->assertStringContainsString($regla, $e->getMessage());

            return;
        }

        $this->fail("La base aceptó un dato que la regla «{$regla}» debía rechazar.");
    }

    /** Inserta una fila y devuelve su id. */
    protected function fila(string $tabla, array $datos = []): string
    {
        $datos = ['id' => (string) Str::ulid(), ...$datos];
        DB::table($tabla)->insert($datos);

        return $datos['id'];
    }

    protected function usuario(string $rol = 'docente', array $datos = []): string
    {
        return $this->fila('usuarios', [
            'nombre' => 'Docente de prueba',
            'email' => Str::lower(Str::random(10)).'@prueba.cl',
            'password' => 'x',
            'rol' => $rol,
            ...$datos,
        ]);
    }

    protected function curso(array $datos = []): string
    {
        return $this->fila('cursos', [
            'nombre' => 'Kinder '.Str::random(4),
            'anio' => 2026,
            'docente_id' => $datos['docente_id'] ?? $this->usuario(),
            ...$datos,
        ]);
    }

    protected function estudiante(array $datos = []): string
    {
        return $this->fila('estudiantes', [
            'nombre' => 'Niño',
            'curso_id' => $datos['curso_id'] ?? $this->curso(),
            ...$datos,
        ]);
    }

    protected function nivel(): string
    {
        $orden = DB::table('niveles')->count() + 1;

        return $this->fila('niveles', ['codigo' => "N{$orden}", 'nombre' => "Nivel {$orden}", 'orden' => $orden]);
    }

    protected function cuento(array $datos = []): string
    {
        return $this->fila('cuentos', [
            'titulo' => 'El auto de Ana',
            'nivel_id' => $datos['nivel_id'] ?? $this->nivel(),
            'autor_id' => $datos['autor_id'] ?? $this->usuario(),
            ...$datos,
        ]);
    }

    protected function validar(string $cuentoId, string $de, string $a, ?string $observacion = null): void
    {
        $this->fila('validaciones', [
            'cuento_id' => $cuentoId,
            'usuario_id' => $this->usuario('revisor'),
            'estado_anterior' => $de,
            'estado_nuevo' => $a,
            'observacion' => $observacion,
        ]);
    }

    protected function categoria(): string
    {
        $orden = DB::table('categorias_pictograma')->count() + 1;

        return $this->fila('categorias_pictograma', ['clave' => "cat{$orden}", 'nombre' => "Categoría {$orden}", 'orden' => $orden]);
    }

    protected function pictograma(array $datos = []): string
    {
        return $this->fila('pictogramas', [
            'palabra' => 'auto',
            'categoria_id' => $datos['categoria_id'] ?? $this->categoria(),
            'origen' => 'propio',
            'imagen_path' => 'pictogramas/auto.webp',
            'alt_text' => 'Un auto rojo',
            ...$datos,
        ]);
    }

    protected function sesionAula(string $cursoId, string $inicio, string $expira, array $datos = []): string
    {
        return $this->fila('sesiones_aula', [
            'curso_id' => $cursoId,
            'abierta_por' => $this->usuario(),
            'agenda_primero' => 'leer',
            'agenda_despues' => 'hablar',
            'inicio_at' => $inicio,
            'expira_at' => $expira,
            ...$datos,
        ]);
    }

    protected function ingresoEnCasa(string $estudianteId): string
    {
        return $this->fila('ingresos', ['estudiante_id' => $estudianteId, 'lugar' => 'casa']);
    }
}
