<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\GenerarAudioRequest;
use App\Voz\ServicioDeAudio;
use App\Voz\VozNoDisponible;
use Illuminate\Http\JsonResponse;

class AudioController extends Controller
{
    public function store(GenerarAudioRequest $request, ServicioDeAudio $servicio): JsonResponse
    {
        try {
            $audio = $servicio->generar($request->validated('texto'));
        } catch (VozNoDisponible) {
            return response()->json(['message' => 'No se pudo generar el audio. Intenta de nuevo en un momento.'], 503);
        }

        return response()->json([
            'url' => $audio->url(),
            'voz' => $audio->voz,
            'enCache' => $audio->enCache,
            'respaldo' => $audio->respaldo,
        ]);
    }
}
