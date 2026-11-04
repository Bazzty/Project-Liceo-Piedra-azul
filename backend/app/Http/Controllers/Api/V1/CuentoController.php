<?php

namespace App\Http\Controllers\Api\V1;

use App\Cuentos\CuentoNoGenerado;
use App\Cuentos\CuentoSinConfigurar;
use App\Cuentos\GeneradorDeCuentos;
use App\Http\Controllers\Controller;
use App\Http\Requests\GenerarCuentoRequest;
use Illuminate\Http\JsonResponse;

class CuentoController extends Controller
{
    public function generar(GenerarCuentoRequest $request, GeneradorDeCuentos $generador): JsonResponse
    {
        try {
            $cuento = $generador->generar(
                $request->validated('tema'),
                $request->validated('nivel'),
                (int) $request->validated('paginas'),
                $this->palabras($request->validated('palabras') ?? []),
            );
        } catch (CuentoSinConfigurar) {
            return response()->json(['message' => 'La IA de cuentos aún no está activada en este servidor.'], 503);
        } catch (CuentoNoGenerado $e) {
            report($e);

            return response()->json(['message' => 'No se pudo crear el cuento. Intenta de nuevo en un momento.'], 503);
        }

        return response()->json($cuento->toArray());
    }

    /**
     * Sin repetidas ni espacios de más.
     *
     * @param  list<string>  $palabras
     * @return list<string>
     */
    private function palabras(array $palabras): array
    {
        return collect($palabras)
            ->map(fn (string $p) => trim((string) preg_replace('/\s+/u', ' ', $p)))
            ->unique(fn (string $p) => mb_strtolower($p))
            ->values()
            ->all();
    }
}
