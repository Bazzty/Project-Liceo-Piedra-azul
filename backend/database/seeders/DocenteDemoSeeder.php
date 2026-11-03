<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Cuenta de la docente para presentar y probar la API en local. La contraseña sale de DEMO_DOCENTE_CLAVE
 * (backend/.env); si falta se inventa una y se muestra. No corre en producción.
 *
 *   docker compose exec --user www-data app php artisan db:seed --class=DocenteDemoSeeder
 */
class DocenteDemoSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            $this->command->error('Esta cuenta de demostración no se crea en producción.');

            return;
        }

        $definida = config('services.demo_docente.clave');
        $clave = $definida ?: Str::password(16, symbols: false);

        User::updateOrCreate(
            ['email' => 'profesora@piedraazul.cl'],
            ['nombre' => 'Profesora PIE', 'password' => $clave, 'rol' => 'docente', 'activo' => true],
        );

        $this->command->info('Docente demo: profesora@piedraazul.cl'.($definida ? '' : " · contraseña: {$clave}"));
    }
}
