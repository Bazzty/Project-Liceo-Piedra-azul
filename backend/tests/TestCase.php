<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    /**
     * Los tests vacían la base (RefreshDatabase). Si por un error de configuración apuntaran a la base
     * de desarrollo, la borrarían: se corta antes de tocarla.
     */
    public function createApplication()
    {
        $app = parent::createApplication();

        $config = $app['config'];
        $base = (string) $config->get('database.connections.'.$config->get('database.default').'.database');

        if (! str_ends_with($base, '_test')) {
            throw new RuntimeException("Los tests apuntan a la base «{$base}», que no es de pruebas (debe terminar en _test).");
        }

        return $app;
    }
}
