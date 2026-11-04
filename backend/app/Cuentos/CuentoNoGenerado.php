<?php

namespace App\Cuentos;

use RuntimeException;

class CuentoNoGenerado extends RuntimeException
{
    public static function sinConfigurar(): self
    {
        return new CuentoSinConfigurar('La IA de cuentos no está configurada.');
    }

    public static function fallo(string $motivo): self
    {
        return new self("No se pudo generar el cuento: {$motivo}");
    }
}
