<?php

namespace App\Voz;

use Illuminate\Contracts\Filesystem\Filesystem;

/**
 * Un audio por texto y voz. Si ya existe se reutiliza (no gasta cuota de la API); si el motor principal
 * falla se usa el de respaldo, que guarda su audio aparte para que luego se pueda regenerar con la API.
 */
class ServicioDeAudio
{
    /** @var list<TtsProvider> */
    private readonly array $motores;

    public function __construct(TtsProvider $principal, ?TtsProvider $respaldo, private readonly Filesystem $disco)
    {
        $this->motores = $respaldo ? [$principal, $respaldo] : [$principal];
    }

    /** @throws VozNoDisponible Si ningún motor pudo generar el audio. */
    public function generar(string $texto): AudioGenerado
    {
        $texto = trim((string) preg_replace('/\s+/u', ' ', $texto));
        $ultimoFallo = new VozNoDisponible('No hay ningún motor de voz configurado.');

        foreach ($this->motores as $indice => $motor) {
            $archivo = hash('sha256', $motor->huella()."\n".$texto).'.mp3';
            $respaldo = $indice > 0;

            if ($this->disco->exists($archivo)) {
                return new AudioGenerado($archivo, $motor->nombre(), enCache: true, respaldo: $respaldo);
            }

            try {
                $mp3 = $motor->sintetizar($texto);
                // Un archivo vacío o que no se pudo escribir se cachearía como bueno y el lector quedaría mudo.
                if ($mp3 === '') {
                    throw VozNoDisponible::fallo($motor->nombre(), 'respuesta vacía');
                }
                if (! $this->disco->put($archivo, $mp3)) {
                    throw VozNoDisponible::fallo($motor->nombre(), 'no se pudo guardar el archivo');
                }
            } catch (VozNoDisponible $fallo) {
                if (! $fallo instanceof MotorSinConfigurar) {
                    report($fallo);
                }
                $ultimoFallo = $fallo;

                continue;
            }

            return new AudioGenerado($archivo, $motor->nombre(), enCache: false, respaldo: $respaldo);
        }

        throw $ultimoFallo;
    }
}
