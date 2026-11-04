<?php

namespace App\Voz;

use RuntimeException;
use Throwable;

class VozNoDisponible extends RuntimeException
{
    public static function sinConfigurar(string $motor): self
    {
        return new MotorSinConfigurar("{$motor} no está configurado.");
    }

    public static function fallo(string $motor, string $motivo, ?Throwable $causa = null): self
    {
        return new self("{$motor} no pudo generar el audio: {$motivo}", previous: $causa);
    }
}
