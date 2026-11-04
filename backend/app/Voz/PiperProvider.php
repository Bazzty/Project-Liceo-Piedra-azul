<?php

namespace App\Voz;

use Illuminate\Support\Facades\Process;

/** Voz local de respaldo (gratis y sin internet): Piper genera un WAV y lame lo pasa a MP3. */
class PiperProvider implements TtsProvider
{
    public function __construct(private readonly string $binario, private readonly string $voz) {}

    public function nombre(): string
    {
        return 'piper';
    }

    public function huella(): string
    {
        return 'piper:'.basename($this->voz);
    }

    public function disponible(): bool
    {
        return is_executable($this->binario);
    }

    public function sintetizar(string $texto): string
    {
        if (! $this->disponible()) {
            throw VozNoDisponible::sinConfigurar('Piper');
        }

        $base = tempnam(sys_get_temp_dir(), 'piper');
        $wav = $base.'.wav';
        $mp3 = $base.'.mp3';

        try {
            Process::input($texto)->timeout(60)->run([$this->binario, '-m', $this->voz, '-f', $wav])->throw();
            Process::timeout(10)->run(['lame', '--quiet', '-b', '64', $wav, $mp3])->throw();

            return (string) file_get_contents($mp3);
        } catch (\Throwable $causa) {
            throw VozNoDisponible::fallo('Piper', 'falló la síntesis', $causa);
        } finally {
            @unlink($base);
            @unlink($wav);
            @unlink($mp3);
        }
    }
}
