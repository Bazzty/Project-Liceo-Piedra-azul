<?php

use App\Voz\ElevenLabsProvider;
use App\Voz\VozNoDisponible;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

function configElevenLabs(array $cambios = []): array
{
    return [
        'clave' => 'clave-de-prueba', 'voz' => 'voz-123', 'modelo' => 'eleven_turbo_v2_5', 'idioma' => 'es',
        'estabilidad' => 0.3, 'similitud' => 1.0, 'velocidad' => 1.0, ...$cambios,
    ];
}

it('pide el audio a la API con la voz y los ajustes del proyecto', function () {
    Http::fake(['api.elevenlabs.io/*' => Http::response('MP3-BYTES', 200, ['Content-Type' => 'audio/mpeg'])]);

    $mp3 = (new ElevenLabsProvider(configElevenLabs()))->sintetizar('Había una vez un oso');

    expect($mp3)->toBe('MP3-BYTES');
    Http::assertSent(function (Request $r) {
        return $r->url() === 'https://api.elevenlabs.io/v1/text-to-speech/voz-123?output_format=mp3_44100_128'
            && $r->hasHeader('xi-api-key', 'clave-de-prueba')
            && $r['text'] === 'Había una vez un oso'
            && $r['model_id'] === 'eleven_turbo_v2_5'
            && $r['language_code'] === 'es'
            && $r['voice_settings'] === ['stability' => 0.3, 'similarity_boost' => 1.0, 'speed' => 1.0];
    });
    Http::assertSentCount(1);
});

it('no llama a la API si falta la clave o la voz', function (array $cambios) {
    Http::fake();

    expect(fn () => (new ElevenLabsProvider(configElevenLabs($cambios)))->sintetizar('Hola'))->toThrow(VozNoDisponible::class);
    Http::assertNothingSent();
})->with([[['clave' => null]], [['clave' => '']], [['voz' => null]]]);

it('falla con VozNoDisponible si la API responde error, sin mostrar la clave', function () {
    Http::fake(['api.elevenlabs.io/*' => Http::response(['detail' => 'quota_exceeded'], 401)]);

    try {
        (new ElevenLabsProvider(configElevenLabs()))->sintetizar('Hola');
        $this->fail('Debió fallar.');
    } catch (VozNoDisponible $e) {
        expect($e->getMessage())->toContain('401')->not->toContain('clave-de-prueba');
    }
    Http::assertSentCount(1); // sin reintentos: cada uno gastaría cuota
});

it('la huella cambia con la voz y los ajustes', function () {
    $base = (new ElevenLabsProvider(configElevenLabs()))->huella();

    expect((new ElevenLabsProvider(configElevenLabs(['voz' => 'otra'])))->huella())->not->toBe($base)
        ->and((new ElevenLabsProvider(configElevenLabs(['estabilidad' => 0.5])))->huella())->not->toBe($base)
        ->and((new ElevenLabsProvider(configElevenLabs(['idioma' => 'en'])))->huella())->not->toBe($base)
        ->and((new ElevenLabsProvider(configElevenLabs(['clave' => 'otra-clave'])))->huella())->toBe($base);
});

it('sin idioma configurado no manda language_code (los modelos multilingual_v2 no lo aceptan)', function () {
    Http::fake(['api.elevenlabs.io/*' => Http::response('MP3', 200)]);

    (new ElevenLabsProvider(configElevenLabs(['idioma' => null, 'modelo' => 'eleven_multilingual_v2'])))->sintetizar('Hola');

    Http::assertSent(fn (Request $r) => ! array_key_exists('language_code', $r->data()));
});
