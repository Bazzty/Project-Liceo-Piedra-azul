<?php

use App\Models\User;
use App\Voz\ServicioDeAudio;
use App\Voz\TtsProvider;
use App\Voz\VozNoDisponible;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

function usarMotor(bool $falla = false): void
{
    $motor = new class($falla) implements TtsProvider
    {
        public function __construct(private bool $falla) {}

        public function nombre(): string
        {
            return 'elevenlabs';
        }

        public function huella(): string
        {
            return 'elevenlabs:prueba';
        }

        public function sintetizar(string $texto): string
        {
            return $this->falla ? throw VozNoDisponible::fallo('elevenlabs', 'simulado') : 'MP3';
        }
    };

    app()->instance(ServicioDeAudio::class, new ServicioDeAudio($motor, null, Storage::fake('audios')));
}

it('inicia sesión con correo y contraseña y entrega un token', function () {
    $docente = User::factory()->create(['email' => 'profe@liceo.cl', 'password' => 'clave-segura-1']);

    $this->postJson('/api/v1/auth/login', ['email' => ' Profe@Liceo.cl ', 'password' => 'clave-segura-1'])
        ->assertOk()
        ->assertJsonPath('usuario.id', $docente->id)
        ->assertJsonPath('usuario.rol', 'docente')
        ->assertJsonMissingPath('usuario.password')
        ->assertJsonStructure(['token']);
});

it('rechaza con el mismo mensaje clave errónea, correo desconocido y cuenta inactiva', function (array $datos) {
    User::factory()->create(['email' => 'profe@liceo.cl', 'password' => 'clave-segura-1']);
    User::factory()->create(['email' => 'baja@liceo.cl', 'password' => 'clave-segura-1', 'activo' => false]);

    $this->postJson('/api/v1/auth/login', $datos)
        ->assertUnauthorized()
        ->assertExactJson(['message' => 'Correo o contraseña incorrectos.']);
})->with([
    'clave errónea' => [['email' => 'profe@liceo.cl', 'password' => 'otra']],
    'correo desconocido' => [['email' => 'nadie@liceo.cl', 'password' => 'clave-segura-1']],
    'cuenta inactiva' => [['email' => 'baja@liceo.cl', 'password' => 'clave-segura-1']],
]);

it('limita los intentos de inicio de sesión', function () {
    foreach (range(1, 5) as $_) {
        $this->postJson('/api/v1/auth/login', ['email' => 'a@b.cl', 'password' => 'x'])->assertUnauthorized();
    }

    $this->postJson('/api/v1/auth/login', ['email' => 'a@b.cl', 'password' => 'x'])->assertTooManyRequests();
});

it('el límite de intentos es por correo: uno bloqueado no bloquea a los demás', function () {
    foreach (range(1, 5) as $_) {
        $this->postJson('/api/v1/auth/login', ['email' => 'a@b.cl', 'password' => 'x'])->assertUnauthorized();
    }

    $this->postJson('/api/v1/auth/login', ['email' => 'a@b.cl', 'password' => 'x'])->assertTooManyRequests();
    $this->postJson('/api/v1/auth/login', ['email' => 'otra@b.cl', 'password' => 'x'])->assertUnauthorized();
});

it('revisa la clave aunque el correo no exista, para que el tiempo no lo delate', function () {
    Hash::shouldReceive('make')->once()->andReturn('hash-falso');
    Hash::shouldReceive('check')->once()->with('x', 'hash-falso')->andReturnFalse();

    $this->postJson('/api/v1/auth/login', ['email' => 'nadie@liceo.cl', 'password' => 'x'])->assertUnauthorized();
});

it('al iniciar sesión borra los tokens vencidos de esa docente y deja los vigentes', function () {
    $docente = User::factory()->create(['password' => 'clave-segura-1']);
    $vencido = $docente->createToken('panel-docente', expiresAt: now()->subHour());
    $vigente = $docente->createToken('panel-docente', expiresAt: now()->addHour());

    $this->postJson('/api/v1/auth/login', ['email' => $docente->email, 'password' => 'clave-segura-1'])->assertOk();

    expect($docente->tokens()->whereKey($vencido->accessToken->getKey())->exists())->toBeFalse()
        ->and($docente->tokens()->whereKey($vigente->accessToken->getKey())->exists())->toBeTrue()
        ->and($docente->tokens()->count())->toBe(2);
});

it('genera un audio con el token de la docente', function () {
    usarMotor();
    $docente = User::factory()->create(['password' => 'clave-segura-1']);
    $token = $this->postJson('/api/v1/auth/login', ['email' => $docente->email, 'password' => 'clave-segura-1'])->json('token');

    $this->withToken($token)->postJson('/api/v1/audio', ['texto' => 'Hola oso'])
        ->assertOk()
        ->assertJsonPath('voz', 'elevenlabs')
        ->assertJsonPath('enCache', false)
        ->assertJsonPath('respaldo', false)
        ->assertJson(fn ($json) => $json->where('url', fn ($url) => str_starts_with($url, '/audio-generado/'))->etc());
});

it('responde 401 en JSON sin token', function () {
    $this->postJson('/api/v1/audio', ['texto' => 'Hola'])->assertUnauthorized();
    $this->post('/api/v1/audio', ['texto' => 'Hola'], ['Accept' => 'text/html'])->assertUnauthorized();
});

it('no deja generar audios al revisor', function () {
    usarMotor();
    Sanctum::actingAs(User::factory()->create(['rol' => 'revisor']));

    $this->postJson('/api/v1/audio', ['texto' => 'Hola'])->assertForbidden();
});

it('valida el texto', function (mixed $texto) {
    usarMotor();
    Sanctum::actingAs(User::factory()->create());

    $this->postJson('/api/v1/audio', ['texto' => $texto])->assertUnprocessable()->assertJsonValidationErrors('texto');
})->with(['vacío' => [''], 'solo espacios' => ['   '], 'ausente' => [null], 'muy largo' => [fn () => str_repeat('a', 601)]]);

it('responde 503 si no hay ninguna voz disponible', function () {
    usarMotor(falla: true);
    Sanctum::actingAs(User::factory()->create());

    $this->postJson('/api/v1/audio', ['texto' => 'Hola'])
        ->assertStatus(503)
        ->assertJsonPath('message', 'No se pudo generar el audio. Intenta de nuevo en un momento.');
});

it('cierra la sesión borrando el token', function () {
    $docente = User::factory()->create(['password' => 'clave-segura-1']);
    $token = $this->postJson('/api/v1/auth/login', ['email' => $docente->email, 'password' => 'clave-segura-1'])->json('token');

    $this->withToken($token)->postJson('/api/v1/auth/logout')->assertNoContent();

    expect($docente->tokens()->count())->toBe(0);
});
