<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

function ollamaResponde(array|string $contenido, int $estado = 200): void
{
    config(['services.ollama.url' => 'http://ollama:11434']);
    $cuerpo = is_array($contenido) ? json_encode($contenido, JSON_UNESCAPED_UNICODE) : $contenido;
    Http::fake(['ollama:11434/*' => Http::response(['message' => ['content' => $cuerpo]], $estado)]);
}

function peticionDeCuento(array $cambios = []): array
{
    return ['tema' => 'El osito va al dentista', 'nivel' => 'B', 'paginas' => 4, ...$cambios];
}

it('crea el borrador de un cuento a partir de un tema', function () {
    Sanctum::actingAs(User::factory()->create());
    ollamaResponde([
        'titulo' => 'El osito y el dentista',
        'descripcion' => 'Un osito pierde el miedo.',
        'frases' => ['El osito va al dentista', 'Abre la boca grande', 'El dentista sonríe', 'El osito está feliz'],
    ]);

    $this->postJson('/api/v1/cuentos/generar', peticionDeCuento())
        ->assertOk()
        ->assertJsonPath('titulo', 'El osito y el dentista')
        ->assertJsonCount(4, 'frases');

    Http::assertSent(fn ($r) => $r['model'] === 'qwen2.5:3b'
        && $r['stream'] === false
        && str_contains($r['messages'][0]['content'], 'Exactamente 4 frases')
        && str_contains($r['messages'][1]['content'], 'El osito va al dentista'));
});

it('acepta la respuesta envuelta en un bloque de código y recorta lo que sobra', function () {
    Sanctum::actingAs(User::factory()->create());
    ollamaResponde("```json\n".json_encode(['titulo' => 'Mi casa', 'frases' => ['Mi casa es azul', '  ', 'Tengo   un gato', 'Mamá me ama']])."\n```");

    $this->postJson('/api/v1/cuentos/generar', peticionDeCuento(['paginas' => 3]))
        ->assertOk()
        ->assertJsonPath('frases', ['Mi casa es azul', 'Tengo un gato', 'Mamá me ama']);
});

it('descarta frases demasiado largas', function () {
    Sanctum::actingAs(User::factory()->create());
    ollamaResponde(['titulo' => 'Largo', 'frases' => [str_repeat('palabra ', 30), 'Hola amigo']]);

    $this->postJson('/api/v1/cuentos/generar', peticionDeCuento())->assertOk()->assertJsonPath('frases', ['Hola amigo']);
});

it('avisa si la IA devuelve algo que no es un cuento', function (string $contenido) {
    Sanctum::actingAs(User::factory()->create());
    ollamaResponde($contenido);

    $this->postJson('/api/v1/cuentos/generar', peticionDeCuento())
        ->assertStatus(503)
        ->assertJsonPath('message', 'No se pudo crear el cuento. Intenta de nuevo en un momento.');
})->with([
    'texto libre' => ['Había una vez un osito'],
    'sin frases' => ['{"titulo":"Vacío","frases":[]}'],
    'sin título' => ['{"frases":["Hola"]}'],
]);

it('avisa si el servidor de IA falla', function () {
    Sanctum::actingAs(User::factory()->create());
    ollamaResponde('', 500);

    $this->postJson('/api/v1/cuentos/generar', peticionDeCuento())->assertStatus(503);
});

it('dice que la IA no está activada cuando falta la dirección, sin llamar a nadie', function () {
    Sanctum::actingAs(User::factory()->create());
    config(['services.ollama.url' => null]);
    Http::fake();

    $this->postJson('/api/v1/cuentos/generar', peticionDeCuento())
        ->assertStatus(503)
        ->assertJsonPath('message', 'La IA de cuentos aún no está activada en este servidor.');
    Http::assertNothingSent();
});

it('envía la clave al servidor de IA solo si existe', function () {
    Sanctum::actingAs(User::factory()->create());
    config(['services.ollama.clave' => 'token-de-prueba']);
    ollamaResponde(['titulo' => 'Hola', 'frases' => ['Hola amigo']]);

    $this->postJson('/api/v1/cuentos/generar', peticionDeCuento())->assertOk();

    Http::assertSent(fn ($r) => $r->hasHeader('Authorization', 'Bearer token-de-prueba'));
});

it('valida el tema, el nivel y las páginas', function (array $cambios, string $campo) {
    Sanctum::actingAs(User::factory()->create());
    Http::fake();

    $this->postJson('/api/v1/cuentos/generar', peticionDeCuento($cambios))->assertUnprocessable()->assertJsonValidationErrors($campo);
    Http::assertNothingSent();
})->with([
    'sin tema' => [['tema' => ''], 'tema'],
    'tema larguísimo' => [['tema' => str_repeat('a', 201)], 'tema'],
    'nivel inventado' => [['nivel' => 'Z'], 'nivel'],
    'una página' => [['paginas' => 1], 'paginas'],
    'veinte páginas' => [['paginas' => 20], 'paginas'],
]);

it('pide ingresar y no deja usarlo al revisor', function () {
    $this->postJson('/api/v1/cuentos/generar', peticionDeCuento())->assertUnauthorized();

    Sanctum::actingAs(User::factory()->create(['rol' => 'revisor']));
    Http::fake();
    $this->postJson('/api/v1/cuentos/generar', peticionDeCuento())->assertForbidden();
    Http::assertNothingSent();
});
