<?php

use App\Http\Controllers\Api\V1\AudioController;
use App\Http\Controllers\Api\V1\AutenticacionController;
use App\Http\Controllers\Api\V1\CuentoController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [AutenticacionController::class, 'login'])->middleware('throttle:login');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/user', function (Request $request) {
            return $request->user();
        });
        Route::post('/auth/logout', [AutenticacionController::class, 'logout']);
        Route::post('/cuentos/generar', [CuentoController::class, 'generar'])->middleware('throttle:cuento-ia');
        Route::post('/cuentos/calentar', [CuentoController::class, 'calentar'])->middleware('throttle:cuento-calentar');
        Route::post('/audio', [AudioController::class, 'store'])->middleware('throttle:audio');
    });
});
