<?php

namespace App\Voz;

/** Un motor de texto a voz. El servicio de audio los prueba en orden: principal primero, respaldo después. */
interface TtsProvider
{
    /** Nombre corto del motor, tal como se muestra a la docente. */
    public function nombre(): string;

    /** Motor + voz + ajustes: entra al hash de la caché, así que cambiar la voz regenera el audio. */
    public function huella(): string;

    /** Tiene lo que necesita para sintetizar (clave, binario). */
    public function disponible(): bool;

    /**
     * @return string El MP3 completo.
     *
     * @throws VozNoDisponible Si el motor no está configurado o falla.
     */
    public function sintetizar(string $texto): string;
}
