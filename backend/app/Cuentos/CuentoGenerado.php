<?php

namespace App\Cuentos;

/** Borrador de cuento: lo revisa y edita la docente antes de enviarlo a revisión. */
final class CuentoGenerado
{
    /** @param list<string> $frases Una por página. */
    public function __construct(
        public readonly string $titulo,
        public readonly string $descripcion,
        public readonly array $frases,
    ) {}

    /** @return array{titulo: string, descripcion: string, frases: list<string>} */
    public function toArray(): array
    {
        return ['titulo' => $this->titulo, 'descripcion' => $this->descripcion, 'frases' => $this->frases];
    }
}
