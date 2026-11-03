<?php

use App\Voz\MotorSinConfigurar;
use App\Voz\PiperProvider;
use App\Voz\VozNoDisponible;

beforeEach(function () {
    if (! is_executable(config('services.piper.binario'))) {
        $this->markTestSkipped('Piper no está instalado: corre las pruebas con make test.');
    }
});

it('devuelve un mp3 y no deja archivos temporales', function () {
    $antes = count(glob(sys_get_temp_dir().'/piper*'));

    $mp3 = (new PiperProvider(config('services.piper.binario'), config('services.piper.voz')))->sintetizar('Hola oso.');

    expect(strlen($mp3))->toBeGreaterThan(2_000)
        ->and(count(glob(sys_get_temp_dir().'/piper*')))->toBe($antes);
});

it('falla con VozNoDisponible y limpia si la voz no existe', function () {
    $antes = count(glob(sys_get_temp_dir().'/piper*'));

    expect(fn () => (new PiperProvider(config('services.piper.binario'), '/no/existe.onnx'))->sintetizar('Hola'))
        ->toThrow(VozNoDisponible::class);
    expect(count(glob(sys_get_temp_dir().'/piper*')))->toBe($antes);
});

it('avisa que no está configurado si falta el binario', function () {
    expect(fn () => (new PiperProvider('/no/hay/piper', '/no/existe.onnx'))->sintetizar('Hola'))
        ->toThrow(MotorSinConfigurar::class);
});
