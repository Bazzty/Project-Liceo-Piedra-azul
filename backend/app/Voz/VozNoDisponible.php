<?php

namespace App\Voz;

use RuntimeException;

class VozNoDisponible extends RuntimeException
{
    public static function sinConfigurar(string $motor): self
    {
        return new self("{$motor} no está configurado.");
    }

    public static function fallo(string $motor, string $motivo): self
    {
        return new self("{$motor} no pudo generar el audio: {$motivo}");
    }
}
