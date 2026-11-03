<?php

use App\Voz\ServicioDeAudio;
use App\Voz\TtsProvider;
use App\Voz\VozNoDisponible;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Exceptions;
use Illuminate\Support\Facades\Storage;

/** Motor falso: cuenta las llamadas y puede fallar a pedido. */
function motorFalso(string $nombre, bool $falla = false, string $voz = 'v1', bool $sinConfigurar = false, string $mp3 = ''): TtsProvider
{
    return new class($nombre, $falla, $voz, $sinConfigurar, $mp3) implements TtsProvider
    {
        public int $llamadas = 0;

        public function __construct(private string $nombre, public bool $falla, private string $voz, private bool $sinConfigurar, private string $mp3) {}

        public function nombre(): string
        {
            return $this->nombre;
        }

        public function huella(): string
        {
            return "{$this->nombre}:{$this->voz}";
        }

        public function sintetizar(string $texto): string
        {
            $this->llamadas++;
            if ($this->sinConfigurar) {
                throw VozNoDisponible::sinConfigurar($this->nombre);
            }
            if ($this->falla) {
                throw VozNoDisponible::fallo($this->nombre, 'simulado');
            }

            return $this->mp3 !== '' || $this->falla === null ? $this->mp3 : "mp3[{$this->nombre}]{$texto}";
        }
    };
}

beforeEach(fn () => $this->disco = Storage::fake('audios'));

it('genera el audio con el motor principal y lo guarda', function () {
    $principal = motorFalso('elevenlabs');

    $audio = (new ServicioDeAudio($principal, null, $this->disco))->generar('Hola oso');

    expect($audio->voz)->toBe('elevenlabs')
        ->and($audio->enCache)->toBeFalse()
        ->and($audio->respaldo)->toBeFalse()
        ->and($audio->url())->toStartWith('/audio-generado/')->toEndWith('.mp3');
    $this->disco->assertExists($audio->archivo);
    expect($this->disco->get($audio->archivo))->toBe('mp3[elevenlabs]Hola oso');
});

it('reutiliza el audio del mismo texto sin volver a gastar cuota', function () {
    $principal = motorFalso('elevenlabs');
    $servicio = new ServicioDeAudio($principal, null, $this->disco);

    $primero = $servicio->generar('Hola oso');
    $segundo = $servicio->generar('Hola oso');

    expect($segundo->enCache)->toBeTrue()
        ->and($segundo->archivo)->toBe($primero->archivo)
        ->and($principal->llamadas)->toBe(1);
});

it('trata igual el texto con espacios de más', function () {
    $principal = motorFalso('elevenlabs');
    $servicio = new ServicioDeAudio($principal, null, $this->disco);

    $a = $servicio->generar("  Hola   oso \n");
    $b = $servicio->generar('Hola oso');

    expect($b->archivo)->toBe($a->archivo)->and($principal->llamadas)->toBe(1);
});

it('cambiar la voz genera otro audio', function () {
    $a = (new ServicioDeAudio(motorFalso('elevenlabs', voz: 'v1'), null, $this->disco))->generar('Hola');
    $b = (new ServicioDeAudio(motorFalso('elevenlabs', voz: 'v2'), null, $this->disco))->generar('Hola');

    expect($b->archivo)->not->toBe($a->archivo);
});

it('usa el respaldo cuando el motor principal falla', function () {
    $principal = motorFalso('elevenlabs', falla: true);
    $respaldo = motorFalso('piper');

    $audio = (new ServicioDeAudio($principal, $respaldo, $this->disco))->generar('Hola');

    expect($audio->voz)->toBe('piper')->and($audio->respaldo)->toBeTrue();
});

it('el audio de respaldo no tapa al de la API cuando esta vuelve', function () {
    $principal = motorFalso('elevenlabs', falla: true);
    $servicio = new ServicioDeAudio($principal, motorFalso('piper'), $this->disco);
    $deRespaldo = $servicio->generar('Hola');

    $principal->falla = false;
    $deLaApi = $servicio->generar('Hola');

    expect($deLaApi->voz)->toBe('elevenlabs')
        ->and($deLaApi->respaldo)->toBeFalse()
        ->and($deLaApi->archivo)->not->toBe($deRespaldo->archivo);
});

it('falla con VozNoDisponible si ningún motor responde', function () {
    $servicio = new ServicioDeAudio(motorFalso('elevenlabs', falla: true), motorFalso('piper', falla: true), $this->disco);

    $servicio->generar('Hola');
})->throws(VozNoDisponible::class);

it('un MP3 vacío no se guarda como bueno: se pasa al respaldo', function () {
    $vacio = motorFalso('elevenlabs', mp3: "\0");
    $servicio = new ServicioDeAudio(new class implements TtsProvider
    {
        public function nombre(): string
        {
            return 'elevenlabs';
        }

        public function huella(): string
        {
            return 'elevenlabs:vacio';
        }

        public function sintetizar(string $texto): string
        {
            return '';
        }
    }, motorFalso('piper'), $this->disco);

    $audio = $servicio->generar('Hola');

    expect($audio->voz)->toBe('piper')->and($audio->respaldo)->toBeTrue();
    expect($this->disco->allFiles())->toHaveCount(1);
});

it('si el archivo no se puede escribir no devuelve una URL que daría 404', function () {
    $disco = Mockery::mock(Filesystem::class);
    $disco->shouldReceive('exists')->andReturnFalse();
    $disco->shouldReceive('put')->andReturnFalse();

    (new ServicioDeAudio(motorFalso('elevenlabs'), null, $disco))->generar('Hola');
})->throws(VozNoDisponible::class, 'no se pudo guardar el archivo');

it('un motor sin configurar usa el respaldo sin reportar un error', function () {
    Exceptions::fake();

    $audio = (new ServicioDeAudio(motorFalso('elevenlabs', sinConfigurar: true), motorFalso('piper'), $this->disco))->generar('Hola');

    expect($audio->voz)->toBe('piper');
    Exceptions::assertNothingReported();
});

it('un fallo real del motor sí se reporta', function () {
    Exceptions::fake();

    (new ServicioDeAudio(motorFalso('elevenlabs', falla: true), motorFalso('piper'), $this->disco))->generar('Hola');

    Exceptions::assertReported(VozNoDisponible::class);
});
