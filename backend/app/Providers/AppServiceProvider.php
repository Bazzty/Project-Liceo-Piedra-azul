<?php

namespace App\Providers;

use App\Voz\ElevenLabsProvider;
use App\Voz\PiperProvider;
use App\Voz\ServicioDeAudio;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(ServicioDeAudio::class, function () {
            $piper = new PiperProvider(config('services.piper.binario'), config('services.piper.voz'));

            if (config('services.tts.driver') === 'piper') {
                return new ServicioDeAudio($piper, null, Storage::disk('audios'));
            }

            return new ServicioDeAudio(new ElevenLabsProvider(config('services.elevenlabs')), $piper, Storage::disk('audios'));
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Detrás de nginx todas las peticiones llegan con la misma IP: limitar solo por IP bloquearía a todo el liceo.
        // Cada correo tiene su cupo (contra adivinar claves) y la IP uno más amplio (contra probar muchos correos).
        RateLimiter::for('login', fn (Request $request) => [
            Limit::perMinute(5)->by(Str::lower((string) $request->input('email')).'|'.$request->ip()),
            Limit::perMinute(60)->by((string) $request->ip()),
        ]);
    }
}
