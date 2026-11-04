<?php

namespace App\Voz;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

/** Voz principal del proyecto. La clave vive solo en el servidor (.env), nunca en el navegador. */
class ElevenLabsProvider implements TtsProvider
{
    /** @param array{clave?: ?string, voz?: ?string, modelo: string, idioma?: ?string, estabilidad: float, similitud: float, velocidad: float} $config */
    public function __construct(private readonly array $config) {}

    public function nombre(): string
    {
        return 'elevenlabs';
    }

    public function huella(): string
    {
        return implode(':', [
            'elevenlabs',
            $this->config['voz'] ?? '',
            $this->config['modelo'],
            $this->config['idioma'] ?? '',
            $this->config['estabilidad'],
            $this->config['similitud'],
            $this->config['velocidad'],
        ]);
    }

    public function sintetizar(string $texto): string
    {
        if (blank($this->config['clave'] ?? null) || blank($this->config['voz'] ?? null)) {
            throw VozNoDisponible::sinConfigurar('ElevenLabs');
        }

        try {
            // Sin reintentos: cada intento que llega a la API gasta caracteres de la cuota.
            $respuesta = Http::withHeaders(['xi-api-key' => $this->config['clave'], 'Accept' => 'audio/mpeg'])
                ->timeout(20)
                ->post('https://api.elevenlabs.io/v1/text-to-speech/'.rawurlencode($this->config['voz']).'?output_format=mp3_44100_128', [
                    'text' => $texto,
                    'model_id' => $this->config['modelo'],
                    ...(filled($this->config['idioma'] ?? null) ? ['language_code' => $this->config['idioma']] : []),
                    'voice_settings' => [
                        'stability' => $this->config['estabilidad'],
                        'similarity_boost' => $this->config['similitud'],
                        'speed' => $this->config['velocidad'],
                    ],
                ]);
        } catch (ConnectionException) {
            throw VozNoDisponible::fallo('ElevenLabs', 'sin conexión');
        }

        if ($respuesta->failed()) {
            throw VozNoDisponible::fallo('ElevenLabs', 'respondió '.$respuesta->status());
        }

        return $respuesta->body();
    }
}
