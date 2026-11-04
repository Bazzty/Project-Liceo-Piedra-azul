<?php

use App\Voz\ServicioDeAudio;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

// Comprueba el cableado: qué motor se usa según TTS_DRIVER y la configuración, con el contenedor real de servicios.
function sinPiper(): bool
{
    return ! is_executable(config('services.piper.binario'));
}

beforeEach(function () {
    Storage::fake('audios');
    config(['services.elevenlabs.clave' => 'clave-de-prueba', 'services.elevenlabs.voz' => 'voz-123']);
});

it('con TTS_DRIVER=elevenlabs genera el audio con la API', function () {
    config(['services.tts.driver' => 'elevenlabs']);
    Http::fake(['api.elevenlabs.io/*' => Http::response('MP3', 200)]);

    $audio = app(ServicioDeAudio::class)->generar('Hola oso');

    expect($audio->voz)->toBe('elevenlabs')->and($audio->respaldo)->toBeFalse();
    Storage::disk('audios')->assertExists($audio->archivo);
});

it('con TTS_DRIVER=piper no llama nunca a la API', function () {
    if (sinPiper()) {
        $this->markTestSkipped('Piper no está instalado: corre las pruebas con make test.');
    }
    config(['services.tts.driver' => 'piper']);
    Http::fake();

    $audio = app(ServicioDeAudio::class)->generar('Hola oso');

    expect($audio->voz)->toBe('piper')->and($audio->respaldo)->toBeFalse();
    Http::assertNothingSent();
});

it('si la API responde error, el audio sale con Piper y queda marcado como respaldo', function () {
    if (sinPiper()) {
        $this->markTestSkipped('Piper no está instalado: corre las pruebas con make test.');
    }
    config(['services.tts.driver' => 'elevenlabs']);
    Http::fake(['api.elevenlabs.io/*' => Http::response('', 500)]);

    $audio = app(ServicioDeAudio::class)->generar('Hola oso');

    expect($audio->voz)->toBe('piper')->and($audio->respaldo)->toBeTrue();
});

it('sin clave de ElevenLabs ni llama a la API: usa Piper directamente', function () {
    if (sinPiper()) {
        $this->markTestSkipped('Piper no está instalado: corre las pruebas con make test.');
    }
    config(['services.tts.driver' => 'elevenlabs', 'services.elevenlabs.clave' => null]);
    Http::fake();

    expect(app(ServicioDeAudio::class)->generar('Hola oso')->respaldo)->toBeTrue();
    Http::assertNothingSent();
});
