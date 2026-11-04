<?php

namespace App\Providers;

use App\Cuentos\GeneradorDeCuentos;
use App\Cuentos\OllamaGenerador;
use App\Models\User;
use App\Voz\ElevenLabsProvider;
use App\Voz\PiperProvider;
use App\Voz\ServicioDeAudio;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;
use Laravel\Sanctum\Sanctum;

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

        $this->app->bind(GeneradorDeCuentos::class, fn () => new OllamaGenerador(config('services.ollama')));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Detrás de nginx todas las peticiones llegan con la misma IP: limitar solo por IP bloquearía a todo el liceo.
        // Cada correo tiene su cupo (contra adivinar claves) y la IP uno más amplio (contra probar muchos correos).
        RateLimiter::for('login', function (Request $request) {
            // El límite corre antes de validar: un correo que no es texto lo rechaza la validación con un 422.
            $correo = $request->input('email');

            return [
                Limit::perMinute(5)->by(Str::lower(is_string($correo) ? $correo : '').'|'.$request->ip()),
                Limit::perMinute(60)->by((string) $request->ip()),
            ];
        });

        // Cada audio nuevo gasta cuota de la API de voz. Los que ya existen tienen cupo aparte: si contaran en el mismo,
        // al reintentar un cuento de más de 30 páginas las primeras gastarían el cupo y la 31 nunca se generaría.
        RateLimiter::for('audio', function (Request $request) {
            $texto = $request->input('texto');
            $usuario = (string) $request->user()?->getKey();

            return is_string($texto) && app(ServicioDeAudio::class)->yaExiste($texto)
                ? Limit::perMinute(300)->by('existente|'.$usuario)
                : Limit::perMinute(30)->by('nuevo|'.$usuario);
        });

        // Cada borrador gasta cuota de la IA.
        RateLimiter::for('cuento-ia', fn (Request $request) => Limit::perMinute(10)->by((string) $request->user()?->getKey()));

        // Una cuenta desactivada pierde sus tokens vigentes de inmediato, no cuando vencen.
        Sanctum::authenticateAccessTokensUsing(
            fn (PersonalAccessToken $token, bool $valido) => $valido && $token->tokenable instanceof User && $token->tokenable->activo,
        );
    }
}
