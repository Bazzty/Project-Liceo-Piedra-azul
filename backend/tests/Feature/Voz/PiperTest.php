<?php

use Illuminate\Support\Facades\Process;

// Prueba la voz de respaldo de punta a punta: texto → WAV con Piper → MP3 con lame.
// Corre dentro del contenedor (make test); fuera de Docker se salta porque no está instalada.
beforeEach(function () {
    if (! is_executable(config('services.piper.binario'))) {
        $this->markTestSkipped('Piper no está instalado: corre las pruebas con make test.');
    }
});

it('genera un mp3 en español a partir de un texto', function () {
    $wav = tempnam(sys_get_temp_dir(), 'piper').'.wav';
    $mp3 = substr($wav, 0, -4).'.mp3';

    Process::input('Había una vez un oso que leía cuentos.')
        ->run([config('services.piper.binario'), '-m', config('services.piper.voz'), '-f', $wav])
        ->throw();
    Process::run(['lame', '--quiet', '-b', '64', $wav, $mp3])->throw();

    expect(file_get_contents($wav, length: 4))->toBe('RIFF')
        ->and(filesize($mp3))->toBeGreaterThan(5_000)
        // Cabecera de un frame MPEG (0xFFF…) o etiqueta ID3.
        ->and(in_array(substr(file_get_contents($mp3, length: 3), 0, 2), ["\xFF\xF3", "\xFF\xFB", "\xFF\xF2", 'ID'], true))->toBeTrue();

    @unlink($wav);
    @unlink($mp3);
});
