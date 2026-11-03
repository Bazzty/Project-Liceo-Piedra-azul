<?php

use App\Voz\ServicioDeAudio;
use App\Voz\TtsProvider;
use App\Voz\VozNoDisponible;
use Illuminate\Support\Facades\Storage;

/** Motor falso: cuenta las llamadas y puede fallar a pedido. */
function motorFalso(string $nombre, bool $falla = false, string $voz = 'v1'): TtsProvider
{
    return new class($nombre, $falla, $voz) implements TtsProvider
    {
        public int $llamadas = 0;

        public function __construct(private string $nombre, public bool $falla, private string $voz) {}

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
            if ($this->falla) {
                throw VozNoDisponible::fallo($this->nombre, 'simulado');
            }

            return "mp3[{$this->nombre}]{$texto}";
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
