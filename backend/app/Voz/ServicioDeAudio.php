<?php

namespace App\Voz;

use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Str;

/**
 * Un audio por texto y voz. Si ya existe se reutiliza (no gasta cuota de la API); si el motor principal
 * falla se usa el de respaldo, que guarda su audio aparte para que luego se pueda regenerar con la API.
 */
class ServicioDeAudio
{
    /** Con punto al inicio: nginx no sirve estas rutas. Dentro del mismo disco, para que renombrar sea atómico. */
    private const TEMPORALES = '.tmp';

    /** @var list<TtsProvider> */
    private readonly array $motores;

    public function __construct(TtsProvider $principal, ?TtsProvider $respaldo, private readonly Filesystem $disco)
    {
        $this->motores = $respaldo ? [$principal, $respaldo] : [$principal];
    }

    /** Si generar este texto llamaría a un motor, igual que generar(): el primero disponible que aún no lo tenga. */
    public function debeSintetizar(string $texto): bool
    {
        $texto = $this->normalizar($texto);

        foreach ($this->motores as $motor) {
            if ($this->existe($this->archivoDe($motor, $texto))) {
                return false;
            }
            if ($motor->disponible()) {
                return true;
            }
        }

        return true;
    }

    /** @throws VozNoDisponible Si ningún motor pudo generar el audio. */
    public function generar(string $texto): AudioGenerado
    {
        $texto = $this->normalizar($texto);
        $ultimoFallo = new VozNoDisponible('No hay ningún motor de voz configurado.');

        foreach ($this->motores as $indice => $motor) {
            $archivo = $this->archivoDe($motor, $texto);
            $respaldo = $indice > 0;

            if ($this->existe($archivo)) {
                return new AudioGenerado($archivo, $motor->nombre(), enCache: true, respaldo: $respaldo);
            }

            try {
                $mp3 = $motor->sintetizar($texto);
                // Un archivo vacío o que no se pudo escribir se cachearía como bueno y el lector quedaría mudo.
                if ($mp3 === '') {
                    throw VozNoDisponible::fallo($motor->nombre(), 'respuesta vacía');
                }
                if (! $this->guardar($archivo, $mp3)) {
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

    private function normalizar(string $texto): string
    {
        return trim((string) preg_replace('/\s+/u', ' ', $texto));
    }

    private function archivoDe(TtsProvider $motor, string $texto): string
    {
        return hash('sha256', $motor->huella()."\n".$texto).'.mp3';
    }

    private function existe(string $archivo): bool
    {
        return $this->disco->exists($archivo) && $this->disco->size($archivo) > 0;
    }

    /** Se escribe aparte y se renombra: un MP3 a medio escribir nunca lleva el nombre que la caché da por bueno. */
    private function guardar(string $archivo, string $mp3): bool
    {
        $temporal = self::TEMPORALES.'/'.$archivo.'.'.Str::random(8);

        if ($this->disco->put($temporal, $mp3) && $this->disco->move($temporal, $archivo)) {
            $this->limpiarTemporales();

            return true;
        }

        $this->disco->delete($temporal);

        return false;
    }

    /** Un proceso interrumpido deja su temporal: pasada una hora ya nadie lo está escribiendo. */
    private function limpiarTemporales(): void
    {
        foreach ($this->disco->files(self::TEMPORALES) as $temporal) {
            if ($this->disco->lastModified($temporal) < now()->subHour()->getTimestamp()) {
                $this->disco->delete($temporal);
            }
        }
    }
}
