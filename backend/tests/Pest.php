<?php

use Tests\TestCase;

// Los tests de esquema son clases PHPUnit y corren tal cual. Los nuevos pueden escribirse con Pest.
pest()->extend(TestCase::class)->in('Feature');
