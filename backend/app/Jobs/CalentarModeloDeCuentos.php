<?php

namespace App\Jobs;

use App\Cuentos\GeneradorDeCuentos;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

/** Carga el modelo de IA en segundo plano para no retener un worker web. Nunca lanza error. */
class CalentarModeloDeCuentos implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public function handle(GeneradorDeCuentos $generador): void
    {
        try {
            $generador->calentar();
        } catch (Throwable $e) {
            report($e);
        }
    }
}
