<?php

namespace App\Cuentos;

interface GeneradorDeCuentos
{
    /**
     * @param  'A'|'B'  $nivel
     *
     * @throws CuentoNoGenerado
     */
    public function generar(string $tema, string $nivel, int $paginas): CuentoGenerado;
}
