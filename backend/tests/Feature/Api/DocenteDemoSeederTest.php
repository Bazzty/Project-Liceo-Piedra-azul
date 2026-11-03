<?php

use App\Models\User;
use Database\Seeders\DocenteDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

function sembrarDocenteDemo(): void
{
    test()->artisan('db:seed', ['--class' => DocenteDemoSeeder::class, '--force' => true])->assertSuccessful();
}

it('crea a la docente de demostración con la clave configurada', function () {
    config(['services.demo_docente.clave' => 'clave-demo-test']);

    sembrarDocenteDemo();

    $docente = User::where('email', 'profesora@piedraazul.cl')->firstOrFail();
    expect($docente->rol)->toBe('docente')
        ->and($docente->activo)->toBeTrue()
        ->and(Hash::check('clave-demo-test', $docente->password))->toBeTrue();
});

it('se puede repetir: no duplica la cuenta y actualiza la clave', function () {
    config(['services.demo_docente.clave' => 'primera-clave']);
    sembrarDocenteDemo();
    config(['services.demo_docente.clave' => 'segunda-clave']);
    sembrarDocenteDemo();

    expect(User::count())->toBe(1)
        ->and(Hash::check('segunda-clave', User::first()->password))->toBeTrue();
});

it('sin clave configurada inventa una y la muestra', function () {
    config(['services.demo_docente.clave' => null]);

    $this->artisan('db:seed', ['--class' => DocenteDemoSeeder::class, '--force' => true])
        ->expectsOutputToContain('contraseña: ')
        ->assertSuccessful();

    expect(User::count())->toBe(1);
});

it('no crea la cuenta en producción', function () {
    $this->app['env'] = 'production';

    sembrarDocenteDemo();

    expect(User::count())->toBe(0);
});
