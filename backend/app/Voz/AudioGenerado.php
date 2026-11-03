<?php

namespace App\Voz;

final readonly class AudioGenerado
{
    public function __construct(
        public string $archivo,
        public string $voz,
        public bool $enCache,
        public bool $respaldo,
    ) {}

    /** Ruta pública relativa: el frontend la guarda tal cual y funciona en cualquier dominio. */
    public function url(): string
    {
        return '/audio-generado/'.$this->archivo;
    }
}
