<?php

namespace App\Cuentos;

interface GeneradorDeCuentos
{
    /**
     * @param  'A'|'B'  $nivel
     * @param  list<string>  $palabras  Palabras que el cuento debe usar (para practicar). Solo palabras: nunca datos de un niño.
     *
     * @throws CuentoNoGenerado
     */
    public function generar(string $tema, string $nivel, int $paginas, array $palabras = []): CuentoGenerado;
}
