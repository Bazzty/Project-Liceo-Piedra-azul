<?php

use App\Http\Controllers\Api\V1\AudioController;
use App\Http\Controllers\Api\V1\AutenticacionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [AutenticacionController::class, 'login'])->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/user', function (Request $request) {
            return $request->user();
        });
        Route::post('/auth/logout', [AutenticacionController::class, 'logout']);
        // Cada audio nuevo gasta cuota de la API de voz: tope por minuto.
        Route::post('/audio', [AudioController::class, 'store'])->middleware('throttle:30,1');
    });
});
